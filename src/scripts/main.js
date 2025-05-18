import { WidgetController } from './controller/WidgetController.js';
import { WidgetView } from './view/WidgetView.js';

document.addEventListener('DOMContentLoaded', () => {
    const viewOptions = {
        questionIds: ['question1', 'question2', 'question3', 'question4', 'question5'],
        resultId: 'result',
        resultTextId: 'pnfResult',
        inputIds: {
            lastFiling: 'lastClaimFilingDate',
            cpStart: 'cpStartDate',
            cpEnd: 'cpEndDate',
        },
    };

    const widgetView = new WidgetView(viewOptions);
    const widgetController = new WidgetController(widgetView, { inputIds: viewOptions.inputIds });

    widgetController.init();
});
