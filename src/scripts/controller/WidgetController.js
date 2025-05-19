import { ClaimLogic } from '../model/ClaimLogic.js';
import { addMonthsUTC, subtractYearsUTC, toUTC } from '../utils/dateUtils.js';

export class WidgetController {
    /** @type {import('../view/WidgetView.js').WidgetView} */
    view;
    /** @type {Object.<string, string>} */
    inputIds;
    /** @type {Date | null} */
    lastFilingDate = null;
    /** @type {Date | null} */
    cpStartDate = null;
    /** @type {Date | null} */
    cpEndDate = null;

    constructor(view, { inputIds = { lastFiling: 'lastClaimFilingDate', cpStart: 'cpStartDate', cpEnd: 'cpEndDate' } } = {}) {
        this.view = view;
        this.inputIds = inputIds;
    }

    /**
     * @brief Initalises the view and binds event handlers.
     * @returns {void}
     */
    init() {
        this.view.initialRender();
        this.view.showQuestion(0);
        this.bindEventHandlers();
    }

    /**
     * @brief Binds event handlers to the questions.
     * @returns {void}
     */
    bindEventHandlers() {
        if (this.view.questions[0]) {
            this.view.on(this.view.questions[0], 'click', '[data-answer]', (e) => {
                const answer = /** @type {HTMLElement} */ (e.target).dataset.answer;
                this.handleQ1Answer(answer);
            });
        }

        if (this.view.questions.length > 1 && this.view.questions[1])
            this.view.on(this.view.questions[1], 'click', 'button[data-action="next"]', () => this.handleQ2Next());

        if (this.view.questions.length > 2 && this.view.questions[2])
            this.view.on(this.view.questions[2], 'click', 'button[data-action="next"]', () => this.handleQ3Next());

        if (this.view.questions.length > 3 && this.view.questions[3]) {
            this.view.on(this.view.questions[3], 'click', '[data-submission]', (e) => {
                const submissionType = /** @type {HTMLElement} */ (e.target).dataset.submission;
                this.handleQ4Next(submissionType);
            });
        }

        if (this.view.questions.length > 4 && this.view.questions[4]) {
            this.view.on(this.view.questions[4], 'click', '[data-everclaimed]', (e) => {
                const everClaimed = /** @type {HTMLElement} */ (e.target).dataset.everclaimed;
                this.handleQ5Next(everClaimed);
            });
        }
    }

    /**
     * @brief                       Retrieves and validates a date from an input field, converting it to UTC
     * @param {string} inputKey     The logical key for the input
     * @param {string} errorMsgText Message to show if input is missing or invalid
     * @returns {Date | null}       The UTC date or null if invalid or not found
     */
    getValidatedUTCDate(inputKey, errorMsgText) {
        const localDate = this.view.requireDateInput(inputKey, errorMsgText);
        return localDate ? toUTC(localDate) : null;
    }

    /**
     * @brief                               Handles the answer to Question 1
     * @param {string | undefined} answer   The user's answer ('yes' or 'no')
     * @returns {void}
     */
    handleQ1Answer(answer) {
        if (answer === 'yes') {
            this.lastFilingDate = null;
            this.cpStartDate = null;
            this.cpEndDate = null;
            this.view.resetInputs(['lastFiling', 'cpStart', 'cpEnd']);
            this.view.showQuestion(1);
            return;
        }
        this.view.showResult(true);
    }

    /**
     * @brief Handle Question 2 anwer
     * @returns {void}
     */
    handleQ2Next() {
        const lastFilingDateRaw = this.getValidatedUTCDate('lastFiling', 'Please enter the date you filed the last claim.');
        if (!lastFilingDateRaw) return;

        this.lastFilingDate = lastFilingDateRaw;
        this.view.showQuestion(2);
    }

    /**
     * @brief           Handles the logic for Question 3: Claim Period (CP) dates. Determines if a PNF is required based on
     *                  the CP start date relative to April 1, 2023.
     * @returns {void}
     */
    handleQ3Next() {
        const cpStartDateRaw = this.getValidatedUTCDate('cpStart', 'Please enter the claim period start date.');
        const cpEndDateRaw = this.getValidatedUTCDate('cpEnd', 'Please enter the claim period end date.');

        if (!cpStartDateRaw || !cpEndDateRaw) return;

        if (!ClaimLogic.isValidClaimPeriod(cpStartDateRaw, cpEndDateRaw)) {
            this.view.showAlert('The claim period start date must be before the end date.');
            return;
        }

        this.cpStartDate = cpStartDateRaw;
        this.cpEndDate = cpEndDateRaw;

        const cnpStart = this.cpStartDate;
        const cnpEnd = addMonthsUTC(this.cpEndDate, 6);
        const lastFilingDate = this.lastFilingDate;
        const april1_2023 = ClaimLogic.APRIL_1_2023_UTC;
        const threeYearsPriorToCnpEnd = subtractYearsUTC(cnpEnd, 3);

        if (!lastFilingDate || !cnpEnd || !threeYearsPriorToCnpEnd) {
            this.view.showAlert('Internal error: date calculation failed.');
            return;
        }

        if (lastFilingDate < cnpStart && lastFilingDate >= april1_2023) {
            this.view.showResult(true, cnpStart, cnpEnd);
            return;
        }

        if (lastFilingDate > cnpEnd && lastFilingDate < april1_2023) {
            this.view.showResult(false, cnpStart, cnpEnd);
            return;
        }

        if (cpStartDateRaw < april1_2023) {
            this.view.showQuestion(3); // Q4
            return;
        }

        this.view.showResult(false, cnpStart, cnpEnd);
    }

    /**
     * @brief                                       Handles submission type for Original Question 4.
     * @param {string | undefined} submissionType   ('original' or 'amended').
     * @returns {void}
     */
    handleQ4Next(submissionType) {
        if (submissionType === 'amended') this.view.showQuestion(4);
        if (submissionType === 'original') this.view.showResult(false);
    }

    /**
     * @brief                               Handles answer for Original Question 5.
     * @param {string | undefined} answer   ('yes' or 'no').
     * @returns {void}
     */
    handleQ5Next(answer) {
        if (answer === 'yes') {
            this.view.showAlert('Please enter the date for the claim made before the one you just described');
            this.view.resetInputs(['lastFiling', 'cpStart', 'cpEnd']);
            this.view.showQuestion(1);
            return;
        }
        this.view.showResult(true);
    }
}
