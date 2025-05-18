import { formatDate, parseDate } from '../utils/dateUtils.js';

export class WidgetView {
    /** @type {(HTMLElement | null)[]} */
    questions = [];
    /** @type {HTMLElement | null} */
    resultEl = null;
    /** @type {HTMLElement | null} */
    resultTextEl = null;
    /** @type {Object.<string, HTMLInputElement | null>} */
    inputs = {};
    /** @type {string} */
    resultId;
    /** @type {string} */
    resultTextId;

    /**
     * @brief                                   Constructs a WidgetView instance
     * @param {WidgetViewOptions} [options={}]  Configuration options for the view.
     */
    constructor({
        questionIds = ['question1', 'question2', 'question3', 'question4', 'question5'],
        resultId = 'result',
        resultTextId = 'pnfResult',
        inputIds = {
            lastFiling: 'lastClaimFilingDate',
            cpStart: 'cpStartDate',
            cpEnd: 'cpEndDate',
        },
    } = {}) {
        this.resultId = resultId;
        this.resultTextId = resultTextId;

        this.questions = questionIds.map((id) => this.qs(`#${id}`));
        this.resultEl = this.qs(`#${this.resultId}`);
        this.resultTextEl = this.qs(`#${this.resultTextId}`);

        for (const [key, id] of Object.entries(inputIds)) {
            this.inputs[key] = /** @type {HTMLInputElement | null} */ (this.qs(`#${id}`));
        }

        if (!this.resultEl)
            console.warn(`WidgetView: Result element with ID '${this.resultId}' not found. Results may not be displayed.`);
        if (!this.resultTextEl)
            console.warn(
                `WidgetView: Result text element with ID '${this.resultTextId}' not found. Result messages may not be displayed.`
            );
    }

    /**
     * @brief                           Query selector helper
     * @param {string} selector         The CSS selector
     * @returns {HTMLElement | null}    The found element or null
     */
    qs(selector) {
        return document.querySelector(selector);
    }

    /**
     * @brief                               Hides an HTML element by adding a 'hidden' class and setting display to 'none'
     * @param {HTMLElement | null} element  The element to hide
     * @returns {void}
     */
    hideElement(element) {
        if (element) {
            element.classList.add('hidden');
            element.style.display = 'none';
        }
    }

    /**
     * @brief                               Shows an HTML element by removing a 'hidden' class and setting display to 'block'
     * @param {HTMLElement | null} element  The element to show
     * @returns {void}
     */
    showElement(element) {
        if (element) {
            element.classList.remove('hidden');
            element.style.display = 'block';
        }
    }

    /**
     * @brief                   Shows a specific question by index and hides others, including the result panel
     * @param {number} index    The index of the question to show
     * @returns {void}
     */
    showQuestion(index) {
        this.hideAllQuestions();
        if (this.resultEl) this.hideElement(this.resultEl);

        const questionElement = this.questions[index];
        if (questionElement) {
            questionElement.classList.add('active');
            this.showElement(questionElement);
        }
    }

    /**
     * @brief Hides all question containers
     * @returns {void}
     */
    hideAllQuestions() {
        this.questions.forEach((q) => {
            if (q) {
                q.classList.remove('active');
                this.hideElement(q);
            }
        });
    }

    /**
     * @brief                   Displays the final result message
     * @param {string} message  The message to display
     * @returns {void}
     */
    showResult(message) {
        this.hideAllQuestions();

        if (this.resultTextEl) {
            this.resultTextEl.textContent = message;
        } else {
            console.warn('WidgetView: Cannot display result message, resultTextEl is not found.');
        }

        if (this.resultEl) this.showElement(this.resultEl);
    }

    /**
     * @brief                       Clears the values of specified input fields
     * @param {string[]} inputKeys  Logical names of the input fields to reset
     * @returns {void}
     */
    resetInputs(inputKeys) {
        inputKeys.forEach((key) => {
            const input = this.inputs[key];
            if (input) input.value = '';
        });
    }

    /**
     * @brief                   Gets the value of a date input field
     * @param {string} inputKey The logical key for the input
     * @returns {string}        The raw value of the input field
     */
    getDateInputValue(inputKey) {
        const inputElement = this.inputs[inputKey];
        return inputElement ? inputElement.value : '';
    }

    /**
     * @brief                           Finds the error span associated with a given input element ID
     * @param {string} inputId          The ID of the input element
     * @returns {HTMLElement | null}    The error span element or null if not found
     * @private
     */
    _findErrorSpan(inputId) {
        const errorSpan = this.qs(`[data-for-input="${inputId}"]`);
        if (!errorSpan) console.warn(`Error span not found for input: ${inputId}`);
        return /** @type {HTMLElement | null} */ (errorSpan);
    }

    /**
     * @brief                                       Clears the error message from an error span
     * @param {HTMLElement | null} errorSpanElement The error span element
     * @private
     */
    _clearError(errorSpanElement) {
        if (errorSpanElement) errorSpanElement.textContent = '';
    }

    /**
     * @brief                                       Displays an error message in an error span
     * @param {HTMLElement | null} errorSpanElement The error span element
     * @param {string} message                      The error message to display
     * @private
     */
    _displayError(errorSpanElement, message) {
        if (errorSpanElement) errorSpanElement.textContent = message;
    }

    /**
     * @brief                       Formats the error message part, capitalizing the first letter if it starts with "please"
     * @param {string} errorMessage The error message
     * @returns {string}            The formatted error message part
     * @private
     */
    _formatErrorMessagePart(errorMessage) {
        if (errorMessage.toLowerCase().startsWith('please'))
            return errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
        return errorMessage;
    }

    /**
     * @brief                           Validates and parses a date input value
     * @param {string} inputValue       The date string
     * @param {string} baseErrorMessage The base error message.
     * @returns {{date: Date | null, error: string | null}} Result object with either a date or an error message
     * @private
     */
    _validateAndParseDate(inputValue, baseErrorMessage) {
        const dateValue = parseDate(inputValue);

        if (dateValue) return { date: dateValue, error: null };

        const messagePart = this._formatErrorMessagePart(baseErrorMessage);
        const specificError = `Invalid date format. ${messagePart}`;

        return { date: null, error: specificError };
    }

    /**
     * @brief                       Validates that a date input field is not empty and is a valid date
     * @param {string} inputKey     The logical key for the input (e.g., 'lastFiling')
     * @param {string} errorMsgText Message to show if input is missing or invalid
     * @returns {Date | null}       The local Date object if valid, otherwise null
     */
    requireDateInput(inputKey, errorMsgText) {
        const inputElement = this.inputs[inputKey];
        if (!inputElement) {
            this.showAlert(`Configuration error: Input element for ${inputKey} not found.`);
            return null;
        }

        const errorSpan = this._findErrorSpan(inputElement.id);
        this._clearError(errorSpan);

        const inputValue = inputElement.value.trim();
        if (!inputValue) {
            this._displayError(errorSpan, errorMsgText);
            inputElement.focus();
            return null;
        }

        const validationResult = this._validateAndParseDate(inputValue, errorMsgText);

        if (validationResult.error) {
            this._displayError(errorSpan, validationResult.error);
            inputElement.focus();
            return null;
        }
        return validationResult.date;
    }

    /**
     * @brief                   Shows an alert message to the user
     * @param {string} message  The message to display
     * @returns {void}
     */
    showAlert(message) {
        alert(message);
    }

    /**
     * @brief                                                       Attaches an event listener to an element, delegating to a selector if provided
     * @param {HTMLElement | null} element                          The target element
     * @param {string} eventType                                    The type of event (e.g., 'click')
     * @param {string | ((event: Event) => void)} selectorOrHandler A CSS selector for delegation or the event handler itself
     * @param {((event: Event) => void)} [handler]                  The event handler if a selector is provided
     * @returns {void}
     */
    on(element, eventType, selectorOrHandler, handler) {
        if (!element) return;

        if (typeof selectorOrHandler === 'string' && typeof handler === 'function') {
            element.addEventListener(eventType, (event) => {
                const eventTarget = event.target;
                if (eventTarget && eventTarget instanceof HTMLElement && eventTarget.matches(selectorOrHandler)) handler(event);
            });
        }

        if (typeof selectorOrHandler === 'function') element.addEventListener(eventType, selectorOrHandler);
    }

    /**
     * @brief           Hides all questions and the result panel initially
     * @returns {void}
     */
    initialRender() {
        this.hideAllQuestions();
        if (this.resultEl) this.hideElement(this.resultEl);
    }

    /**
     * @brief                                       Displays the final result message with title and description
     * @param {Object} options                      The options for the result
     * @param {boolean} options.isPNFRequired       Whether PNF is required
     * @param {Date|null} options.nextClaimPeriod   The next claim period start date
     * @param {Date|null} options.endOfCNP          The end of the CNP period
     * @returns {void}
     */
    showDecisionResult({ isPNFRequired, nextClaimPeriod, endOfCNP }) {
        this.hideAllQuestions();
        if (!this.resultEl || !this.resultTextEl) return;
        this.resultEl.classList.remove('result-output--success', 'result-output--danger');
        if (isPNFRequired) {
            this._showPNFRequired(nextClaimPeriod, endOfCNP);
            return;
        }
        this._showNoPNFRequired();
    }

    /**
     * @brief                               Shows the PNF Required result message
     * @param {Date|null} nextClaimPeriod   The next claim period start date
     * @param {Date|null} endOfCNP          The end of the CNP period
     * @returns {void}
     */
    _showPNFRequired(nextClaimPeriod, endOfCNP) {
        const title = 'PNF Required.';
        let message = 'You will need to prenotify HMRC for your next R&D claim.';

        if (nextClaimPeriod && endOfCNP)
            message += ` For <span class="result-output__date">${formatDate(nextClaimPeriod)}</span>, you need to submit the prenotification form by <span class="result-output__date">${this.formatDate(endOfCNP)}</span>.`;

        message += ' Click here to use our handy tool!';
        this.resultEl.classList.add('result-output--danger');
        this.resultTextEl.innerHTML = `<div class="result-output__title">${title}</div><div class="result-output__desc">${message}</div>`;
        this.showElement(this.resultEl);
    }

    /**
     * @brief           Shows the No PNF Required result message
     * @returns {void}
     */
    _showNoPNFRequired() {
        const title = 'No PNF Required.';
        const message =
            'You do not need to submit a prenotification form to HMRC for your next claim. However, if you would like to anyway you can use our tool here!';
        this.resultEl.classList.add('result-output--success');
        this.resultTextEl.innerHTML = `<div class="result-output__title">${title}</div><div class="result-output__desc">${message}</div>`;
        this.showElement(this.resultEl);
    }
}
