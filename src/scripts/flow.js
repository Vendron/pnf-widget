import { qs, show, hide, on } from "./utils.js";

export class PNFFlow {
    constructor() {
        this.questions = ["#q1", "#q2"].map((q) => qs(q));
        this.resultEl = qs("#result");
    }

    init() {
        this.hideAll();
        this.showQuestion(0);
        this.bind();
    }

    hideAll() {
        this.questions.forEach(hide);
        hide(this.resultEl);
    }

    showQuestion(i) {
        this.hideAll();
        show(this.questions[i]);
    }

    bind() {
        on("#app", "click", "[data-answer]", (e) =>
            this.handleQ1(e.target.dataset.answer)
        );
        on("#app", "click", "[data-next]", () => this.handleQ2());
    }

    handleQ1(answer) {
        if (answer === "yes") return this.showQuestion(1);

        this.showResult("PNF Required");
    }

    handleQ2() {
        const date = qs("#lastClaim").value;

        if (!date) return alert("Enter a date");

        this.lastClaimDate = new Date(date);
        this.showResult("Next steps pending");
    }

    showResult(msg) {
        this.hideAll();
        this.resultEl.textContent = msg;

        show(this.resultEl);
    }
}
