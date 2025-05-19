import { addMonthsUTC, subtractYearsUTC, toUTC } from '../utils/dateUtils.js';

export class ClaimLogic {
    static PNF_REQUIRED = 'PNF Required';
    static NO_PNF_REQUIRED = 'No PNF Required';
    static APRIL_1_2023_UTC = toUTC(new Date(2023, 3, 1));

    /**
     * @brief                                           Calculates the Claim Notification Period (CNP) start and end dates.
     * @param {Date} cpStartDate                        Claim period start date
     * @param {Date} cpEndDate                          Claim period end date
     * @returns {{cnpStart: Date, cnpEnd: Date} | null} Returns CNP start and end dates or null if an error occurs.
     */
    static calculateCNP(cpStartDate, cpEndDate) {
        if (
            !cpStartDate ||
            !cpEndDate ||
            !(cpStartDate instanceof Date) ||
            !(cpEndDate instanceof Date) ||
            isNaN(cpStartDate.getTime()) ||
            isNaN(cpEndDate.getTime())
        ) {
            console.error('CalculateCNP: Invalid date objects provided.', { cpStartDate, cpEndDate });
            return null;
        }
        const cnpEnd = addMonthsUTC(cpEndDate, 6);
        if (!cnpEnd) {
            console.error('CalculateCNP: addMonthsUTC failed to calculate cnpEnd.');
            return null;
        }
        return { cnpStart: cpStartDate, cnpEnd };
    }

    /**
     * @brief                       Checks if a filing date is relevant (within 3-year CNP window)
     * @param {Date} filingDate     The date the last R&D claim was filed
     * @param {Date} todayUTC       The current UTC date
     * @returns {boolean}           True if filing date is within the 3-year window and CNP is not expired
     */
    static isFilingDateRelevant(filingDate, todayUTC) {
        if (!filingDate || !todayUTC) return false;

        const assumedCnpEnd = addMonthsUTC(filingDate, 6);

        if (!assumedCnpEnd) return false;

        const minRelevantDate = subtractYearsUTC(todayUTC, 3);

        if (!minRelevantDate) return false;

        return filingDate.getTime() >= minRelevantDate.getTime() && assumedCnpEnd.getTime() >= todayUTC.getTime();
    }

    /**
     * @brief                       Validates that the claim period start date is before the end date.
     * @param {Date} cpStartDate    Claim period start date.
     * @param {Date} cpEndDate      Claim period end date.
     * @returns {boolean}           True if valid, false otherwise.
     */
    static isValidClaimPeriod(cpStartDate, cpEndDate) {
        if (!cpStartDate || !cpEndDate) return false;
        return cpStartDate.getTime() < cpEndDate.getTime();
    }

    /**
     * @brief                           Determines the outcome for Original Question 3 logic.
     * @param {Date} lastFilingDateUTC  Last filing date (UTC).
     * @param {Date} cpStartDateUTC     Claim period start date (UTC).
     * @param {Date} cpEndDateUTC       Claim period end date (UTC).
     * @returns {{result?: string, nextQuestionIndex?: number} | null} Outcome or null if error.
     */
    static determineQ3Outcome(lastFilingDateUTC, cpStartDateUTC, cpEndDateUTC) {
        if (!ClaimLogic.APRIL_1_2023_UTC) {
            console.error('Critical application error: Reference date not set in ClaimLogic.determineQ3Outcome.');
            return null;
        }
        if (!lastFilingDateUTC || !cpStartDateUTC || !cpEndDateUTC) {
            console.error('determineQ3Outcome: Missing or invalid date parameters.');
            return null;
        }

        const cnpEndDateUTC = addMonthsUTC(cpEndDateUTC, 6);
        if (!cnpEndDateUTC) {
            console.error('determineQ3Outcome: Failed to calculate cnpEndDateUTC.');
            return null;
        }

        const threeYearsPriorToCnpEndUTC = subtractYearsUTC(cnpEndDateUTC, 3);
        if (!threeYearsPriorToCnpEndUTC) {
            console.error('determineQ3Outcome: Failed to calculate threeYearsPriorToCnpEndUTC.');
            return null;
        }

        const relevantFilingWindowStartUTC = new Date(threeYearsPriorToCnpEndUTC.getTime());
        relevantFilingWindowStartUTC.setUTCDate(relevantFilingWindowStartUTC.getUTCDate() + 1);

        if (
            lastFilingDateUTC.getTime() < relevantFilingWindowStartUTC.getTime() ||
            lastFilingDateUTC.getTime() > cnpEndDateUTC.getTime()
        ) {
            return { result: ClaimLogic.PNF_REQUIRED };
        }

        if (cpStartDateUTC.getTime() < ClaimLogic.APRIL_1_2023_UTC.getTime()) return { nextQuestionIndex: 3 };

        return { result: ClaimLogic.NO_PNF_REQUIRED };
    }

    /**
     * @brief                       Determines if PNF is required (last filing before CNP start).
     * @param {Date} lastFilingDate Last filing date
     * @param {Date} cnpStart       The start date of the Claim Notification Period (CNP)
     * @returns {boolean}           True if PNF is required, false otherwise
     */
    static shouldRequirePNF(lastFilingDate, cnpStart) {
        if (!lastFilingDate || !cnpStart) return false;
        return lastFilingDate.getTime() < cnpStart.getTime();
    }

    /**
     * @brief                       Determines if should go to original question 3 (last filing after CNP end and after April 1, 2023).
     * @param {Date} lastFilingDate Last filing date
     * @param {Date} cnpEnd         The end date of the Claim Notification Period (CNP)
     * @returns {boolean}           True if should go to original question 3, false otherwise
     */
    static shouldGoToOriginalQuestion3(lastFilingDate, cnpEnd) {
        if (!ClaimLogic.APRIL_1_2023_UTC || !lastFilingDate || !cnpEnd) {
            console.error('shouldGoToOriginalQuestion3: Missing critical date information.');
            return false;
        }
        return lastFilingDate.getTime() > cnpEnd.getTime() && lastFilingDate.getTime() >= ClaimLogic.APRIL_1_2023_UTC.getTime();
    }

    /**
     * @brief                       Determines if should show No PNF Required (last filing after CNP end and before April 1, 2023).
     * @param {Date} lastFilingDate Last filing date
     * @param {Date} cnpEnd         The end date of the Claim Notification Period (CNP)
     * @returns {boolean}           True if no PNF is required, false otherwise
     */
    static shouldShowNoPNFRequired(lastFilingDate, cnpEnd) {
        if (!ClaimLogic.APRIL_1_2023_UTC || !lastFilingDate || !cnpEnd) {
            console.error('shouldShowNoPNFRequired: Missing critical date information.');
            return false;
        }
        return lastFilingDate.getTime() > cnpEnd.getTime() && lastFilingDate.getTime() < ClaimLogic.APRIL_1_2023_UTC.getTime();
    }
}
