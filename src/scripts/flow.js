import {
    qs,
    showElement,
    hideElement,
    on,
    toUTC,
    addMonthsUTC,
    subtractYearsUTC,
    requireDateInput,
} from "./utils.js";

export class PNFFlow {
    static PNF_REQUIRED = "PNF Required";
    static NO_PNF_REQUIRED = "No PNF Required";

    /**
     * @brief                                           Initializes the PNFFlow instance.
     * @property {string[]} [questionIds]               IDs of question containers in order.
     * @property {string} [resultId]                    ID of the result container.
     * @property {string} [resultTextId]                ID of the paragraph for result text.
     * @property {Object.<string, string>} [inputIds]   Map of logical names to input IDs.
     */

    /**
     * @brief                               Constructs a PNFFlow instance.
     * @param {PNFFlowOptions} [options={}] Configuration options for the flow.
     */
    constructor({
        questionIds = [
            "question1",
            "question2",
            "question3",
            "question4",
            "question5",
        ],
        resultId = "result",
        resultTextId = "pnfResult",
        inputIds = {
            lastFiling: "lastClaimFilingDate",
            cpStart: "cpStartDate",
            cpEnd: "cpEndDate",
        },
    } = {}) {
        /** @type {(HTMLElement | null)[]} */
        this.questions = questionIds.map((id) => qs(`#${id}`));
        /** @type {HTMLElement | null} */
        this.resultEl = qs(`#${resultId}`);
        /** @type {HTMLElement | null} */
        this.resultTextEl = qs(`#${resultTextId}`);
        /** @type {Object.<string, HTMLInputElement | null>} */
        this.inputs = {};

        for (const [key, id] of Object.entries(inputIds)) {
            this.inputs[key] = /** @type {HTMLInputElement | null} */ (
                qs(`#${id}`)
            );
        }

        /** @type {Date | null} */
        this.APRIL_1_2023_UTC = toUTC(new Date(2023, 3, 1)); // Month is 0-indexed (April)
        /** @type {number} */
        this.currentQuestionIndex = 0;
    }

    /**
     * @brief   Initializes the flow by hiding all questions, showing the first one, and binding event handlers.
     * @returns {void}
     */
    init() {
        this.hideAllQuestions();
        this.showQuestion(0);
        this.bindHandlers();
    }

    /**
     * @brief   Binds event handlers to the various interactive elements in the flow.
     * @returns {void}
     */
    bindHandlers() {
        on(qs("#question1"), "click", "[data-answer]", (e) =>
            this.handleQ1((e.target).dataset.answer)
        );
        on(qs("#question2"), "click", 'button[data-action="next"]', () =>
            this.handleQ2()
        );
        on(qs("#question3"), "click", 'button[data-action="next"]', () =>
            this.handleQ3()
        );
        on(qs("#question4"), "click", "[data-submission]", (e) =>
            this.handleQ4(
                (e.target).dataset.submission
            )
        );
        on(qs("#question5"), "click", "[data-everclaimed]", (e) =>
            this.handleQ5(
                (e.target).dataset.everclaimed
            )
        );
    }

    /**
     * @brief               Shows a specific question by index and hides others.
     * @param {number} i    The index of the question to show.
     * @returns {void}
     */
    showQuestion(i) {
        this.hideAllQuestions();

        if (this.resultEl) hideElement(this.resultEl);

        const q = this.questions[i];

        if (q) q.classList.add("active");

        this.currentQuestionIndex = i;
    }

    /**
     * @brief           Hides all question containers.
     * @returns {void}  Removes active class from all questions.
     */
    hideAllQuestions() {
        this.questions.forEach((q) => q && q.classList.remove("active"));
    }

    /**
     * @brief                   Displays the final result message.
     * @param {string} message  The message to display.
     * @returns {void}
     */
    showResult(message) {
        this.hideAllQuestions();

        if (this.resultTextEl) this.resultTextEl.textContent = message;
        if (this.resultEl) showElement(this.resultEl);
    }

    /**
     * @brief                   Clears the values of specified input fields.
     * @param {...string} keys  Logical names of the input fields to reset (from inputIds map).
     * @returns {void}
     */
    resetInputs(...keys) {
        keys.forEach((key) => {
            const input = this.inputs[key];
            if (input) input.value = "";
        });
    }

    /**
     * @brief                       Validates a specific date input, converts it to UTC, and returns it.
     * @param {string} inputKey     The logical key for the input (e.g., 'lastFiling').
     * @param {string} errorMsgText Message to show if input is missing or invalid.
     * @returns {Date | null}       The UTC date or null if invalid.
     */
    getValidatedUTCDate(inputKey, errorMsgText) {
        const inputElement = this.inputs[inputKey];
        const localDate = requireDateInput(inputElement, errorMsgText);
        return localDate ? toUTC(localDate) : null;
    }

    /**
     * @brief                               Handles the answer to Question 1.
     * @param {string | undefined} answer   The user's answer ('yes' or 'no').
     * @returns {void}
     */
    handleQ1(answer) {
        if (answer === "yes") return this.showQuestion(1); 
        this.showResult(PNFFlow.PNF_REQUIRED);
    }

    /**
     * @brief   Handles the action for Question 2.
     * @returns {void}
     */
    handleQ2() {
        const lastFilingDate = this.getValidatedUTCDate(
            "lastFiling",
            "Please enter the date you filed the last claim."
        );
        if (!lastFilingDate) return;
        this.showQuestion(2);
    }

    /**
     * @brief   Handles the action for Question 3
     * @returns {void}
     */
    handleQ3() {
        const lastFilingDateUTC = this.getValidatedUTCDate(
            "lastFiling",
            "Missing last claim filing date. Please return to the previous step."
        );
        if (!lastFilingDateUTC) {
            this.showQuestion(1);
            return;
        }

        const cpStartDateUTC = this.getValidatedUTCDate(
            "cpStart",
            "Please enter the claim period start date."
        );
        const cpEndDateUTC = this.getValidatedUTCDate(
            "cpEnd",
            "Please enter the claim period end date."
        );

        if (!cpStartDateUTC || !cpEndDateUTC) return;

        if (cpStartDateUTC.getTime() >= cpEndDateUTC.getTime()) {
            alert("The claim period start date must be before the end date.");
            return;
        }

        if (!this.APRIL_1_2023_UTC) {
            alert("Critical application error: Reference date not set.");
            return;
        }

        const cnpEndDateUTC = addMonthsUTC(cpEndDateUTC, 6);
        if (!cnpEndDateUTC) {
            alert("Could not calculate Claim Notification Period End Date.");
            return;
        }

        const threeYearsPriorToCnpEndUTC = subtractYearsUTC(cnpEndDateUTC, 3);
        if (!threeYearsPriorToCnpEndUTC) {
            alert("Could not calculate the 3-year prior date for CNP window.");
            return;
        }

        const relevantFilingWindowStartUTC = new Date(
            threeYearsPriorToCnpEndUTC.getTime()
        );
        relevantFilingWindowStartUTC.setUTCDate(
            relevantFilingWindowStartUTC.getUTCDate() + 1
        );

        if (
            lastFilingDateUTC.getTime() <
                relevantFilingWindowStartUTC.getTime() ||
            lastFilingDateUTC.getTime() > cnpEndDateUTC.getTime()
        ) {
            this.showResult(PNFFlow.PNF_REQUIRED);
            return;
        }

        if (cpStartDateUTC.getTime() < this.APRIL_1_2023_UTC.getTime()) {
            this.showQuestion(3);
        } else {
            this.showResult(PNFFlow.NO_PNF_REQUIRED);
        }
    }

    /**
     * @brief                           Handles the answer to Question 4
     * @param {string} submissionType   The type of submission ('original' or 'amended').
     * @returns {void}
     */
    handleQ4(submissionType) {
        if (submissionType === "amended") this.showQuestion(4);
        if (submissionType === "original") this.showResult(PNFFlow.NO_PNF_REQUIRED);
    }

    /**
     * @brief                   Handles the answer to Question 5
     * @param {string} answer   The user's answer ('yes' or 'no').
     * @returns {void}
     */
    handleQ5(answer) {
        if (answer === "yes") {
            alert(
                "Please now enter the details for the claim made *before* the one you just described in the previous steps."
            );
            this.resetInputs("lastFiling", "cpStart", "cpEnd");
            this.showQuestion(1);
        } else {
            this.showResult(PNFFlow.PNF_REQUIRED);
        }
    }
}
