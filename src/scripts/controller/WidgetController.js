import { ClaimLogic } from '../model/ClaimLogic.js';
import { subtractYearsUTC, toUTC } from '../utils/dateUtils.js';

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
    /** @type {Date | null} */
    cnpStartDate = null;
    /** @type {Date | null} */
    cnpEndDate = null;

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
                this.handleQ4Submission(submissionType);
            });
        }

        if (this.view.questions.length > 4 && this.view.questions[4]) {
            this.view.on(this.view.questions[4], 'click', '[data-everclaimed]', (e) => {
                const everClaimed = /** @type {HTMLElement} */ (e.target).dataset.everclaimed;
                this.handleQ5EverClaimed(everClaimed);
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
            this.cnpStartDate = null;
            this.cnpEndDate = null;
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
        this.cpStartDate = null;
        this.cpEndDate = null;
        this.cnpStartDate = null;
        this.cnpEndDate = null;
        this.view.resetInputs(['cpStart', 'cpEnd']);
        this.view.showQuestion(2);
    }

    /**
     * @brief Calculates the Claim Notification Period (CNP) and determines if a PNF is required.
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

        if (!this.lastFilingDate) {
            this.view.showAlert('Last filing date is missing. Please go back to the previous step.');
            this.view.showQuestion(1);
            return;
        }
        if (!ClaimLogic.APRIL_1_2023_UTC) {
            this.view.showAlert('Critical error: April 1, 2023 reference date is not set.');
            return;
        }

        const cnp = ClaimLogic.calculateCNP(this.cpStartDate, this.cpEndDate);
        if (!cnp) {
            this.view.showAlert('Could not calculate Claim Notification Period. Please check dates.');
            return;
        }
        this.cnpStartDate = cnp.cnpStart;
        this.cnpEndDate = cnp.cnpEnd;

        const lastFilingTime = this.lastFilingDate.getTime();
        const cnpStartTime = this.cnpStartDate.getTime();
        const cnpEndTime = this.cnpEndDate.getTime();
        const april1_2023_Time = ClaimLogic.APRIL_1_2023_UTC.getTime();
        const cpStartTime = this.cpStartDate.getTime();

        if (lastFilingTime < cnpStartTime) {
            this.view.showResult(true, this.cpStartDate, this.cnpEndDate);
            return;
        }

        if (lastFilingTime > cnpEndTime && lastFilingTime < april1_2023_Time) {
            this.view.showResult(false, this.cpStartDate, this.cnpEndDate);
            return;
        }

        if (lastFilingTime > cnpEndTime && lastFilingTime >= april1_2023_Time && cpStartTime < april1_2023_Time) {
            this.view.showQuestion(3);
            return;
        }

        if (lastFilingTime > cnpEndTime && lastFilingTime >= april1_2023_Time) {
            this.view.showResult(false, this.cpStartDate, this.cnpEndDate);
            return;
        }

        const threeYearsPriorToCnpEnd = subtractYearsUTC(this.cnpEndDate, 3);
        if (!threeYearsPriorToCnpEnd) {
            this.view.showAlert('Error calculating 3-year relevance window for CNP.');
            return;
        }
        const relevantFilingWindowStart = new Date(threeYearsPriorToCnpEnd.getTime());
        relevantFilingWindowStart.setUTCDate(relevantFilingWindowStart.getUTCDate() + 1);
        const relevantFilingWindowStartTime = relevantFilingWindowStart.getTime();

        if (lastFilingTime < relevantFilingWindowStartTime) {
            this.view.showResult(true, this.cpStartDate, this.cnpEndDate);
            return;
        }

        if (cpStartTime < april1_2023_Time) {
            this.view.showQuestion(3);
            return;
        }

        this.view.showResult(false, this.cpStartDate, this.cnpEndDate);
    }

    /**
     * @brief                                       Handles submission type for Original Question 4.
     * @param {string | undefined} submissionType   ('original' or 'amended').
     * @returns {void}
     */
    handleQ4Submission(submissionType) {
        if (submissionType === 'amended') this.view.showQuestion(4);
        if (submissionType === 'original') this.view.showResult(false);
    }

    /**
     * @brief                               Handles answer for Original Question 5.
     * @param {string | undefined} answer   ('yes' or 'no').
     * @returns {void}
     */
    handleQ5EverClaimed(answer) {
        if (answer === 'yes') {
            this.view.showAlert('Please enter the date for the claim made before the one you just described');
            this.view.resetInputs(['lastFiling', 'cpStart', 'cpEnd']);
            this.view.showQuestion(1);
            return;
        }
        this.view.showResult(true);
    }
}
