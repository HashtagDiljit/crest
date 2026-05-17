/* eslint-disable @typescript-eslint/no-unused-vars */
import { Play, Zap } from "lucide-react";
import { startSession, startBlankSession } from "../../actions";

async function blankAction(formData: FormData): Promise<void> {
  "use server";
  await startBlankSession();
}

function BlankButton() {
  return (
    <form action={blankAction}>
      <button
        type="submit"
        className="flex items-center gap-2 px-5 py-3 rounded-r4 bg-bg-elevated hover:bg-bg-overlay border border-border-strong text-text-primary text-13 font-semibold transition-colors"
      >
        <Zap size={16} className="text-warning" />
        Blank session
      </button>
    </form>
  );
}

function TemplateButton({ templateId }: { templateId: string }) {
  async function templateAction(formData: FormData): Promise<void> {
    "use server";
    await startSession(templateId);
  }
  return (
    <form action={templateAction} className="mt-auto">
      <button
        type="submit"
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-r3 bg-accent hover:bg-accent-hover text-white text-12 font-semibold transition-colors"
      >
        <Play size={11} fill="white" />
        Start session
      </button>
    </form>
  );
}

export const StartButtons = { Blank: BlankButton, Template: TemplateButton };
