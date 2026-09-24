/**
 * ─ Put everything back ─
 *
 * The dialog behind the rail's last button, on every screen whatever
 * its mode, since a proposal opens it wherever it arrives. Alone, it
 * asks once and the reset is made. With peers, it is confirmed twice:
 * the first confirm asks everyone, and the same dialog opens on every
 * screen from the proposal in the store, with the tally live; a peer
 * answers to put back or to keep it as it is; and once everyone here
 * has agreed, the proposer confirms again. A decline ends it: the
 * dialog stays, saying how many declined, until each screen closes it.
 * The proposer's Cancel or Escape withdraws while it is live; a peer
 * who has not answered is asked, and Escape is no answer.
 * Decision: DECISIONS.md, putting everything back is unanimous.
 */

import { AlertDialog } from "radix-ui";
import type { ReactNode } from "react";
import {
  isDeclined,
  isUnanimous,
  tallyOf,
  type Proposal,
  type Tally,
} from "../../state/slices/viewing.js";
import { useStore } from "../../state/store.js";
import { answerReset, confirmReset, proposeReset, withdrawReset } from "../../viewing/proposal.js";
import { DIALOG_CONTENT, DIALOG_OVERLAY, DIALOG_TITLE } from "../atoms/Card.js";
import { TextButton } from "../atoms/TextButton.js";

const DESCRIPTION = "font-serif text-base leading-snug text-ink";
const STATUS = "font-sans text-sm text-muted";

// How the proposal stands, in a line: declined and over, everyone agreed, or the count so far.
function statusOf(tally: Tally, proposal: Proposal): string {
  if (isDeclined(tally)) {
    return `${tally.declined} declined. It stays as it is.`;
  }
  const count = isUnanimous(tally)
    ? "Everyone has agreed."
    : `${tally.agreed} of ${tally.counted} have agreed.`;
  return proposal.by !== undefined && proposal.mine === true ? `You agreed. ${count}` : count;
}

export function PutEverythingBack() {
  const peers = useStore((store) => store.peers);
  const proposal = useStore((store) => store.proposal);
  const asking = useStore((store) => store.askingReset);
  const askReset = useStore((store) => store.askReset);
  const closeProposal = useStore((store) => store.closeProposal);
  const tally = tallyOf({ peers, proposal });
  const alone = Object.keys(peers).length === 0;
  const declined = isDeclined(tally);
  const mine = proposal !== undefined && proposal.by === undefined;
  const answered = proposal !== undefined && proposal.mine !== undefined;
  // A peer who has not answered a live proposal is asked, and nothing else.
  const mustAnswer = proposal !== undefined && !mine && !answered && !declined;
  const open = asking || proposal !== undefined;

  // Escape, Cancel and Close: what letting the dialog go means in each state.
  const dismiss = (): void => {
    if (proposal === undefined) {
      askReset(false);
    } else if (mine && !declined) {
      withdrawReset();
    } else {
      closeProposal();
    }
  };
  const asker =
    proposal?.by === undefined
      ? ""
      : `${peers[proposal.by]?.name || "Someone here"} asks to put everything back. `;

  let buttons: ReactNode;
  if (proposal === undefined) {
    buttons = (
      <>
        <AlertDialog.Cancel asChild>
          <TextButton>Cancel</TextButton>
        </AlertDialog.Cancel>
        <TextButton
          tone="primary"
          onClick={() => {
            proposeReset();
            askReset(false);
          }}
        >
          {alone ? "Put back" : "Ask everyone"}
        </TextButton>
      </>
    );
  } else if (mustAnswer) {
    buttons = (
      <>
        <TextButton onClick={() => answerReset(false)}>Keep as it is</TextButton>
        <TextButton tone="primary" onClick={() => answerReset(true)}>
          Put back
        </TextButton>
      </>
    );
  } else if (mine && !declined) {
    buttons = (
      <>
        <AlertDialog.Cancel asChild>
          <TextButton>Cancel</TextButton>
        </AlertDialog.Cancel>
        <TextButton tone="primary" disabled={!isUnanimous(tally)} onClick={() => confirmReset()}>
          Put back
        </TextButton>
      </>
    );
  } else {
    buttons = (
      <>
        {declined && (
          <TextButton tone="primary" disabled>
            Put back
          </TextButton>
        )}
        <AlertDialog.Cancel asChild>
          <TextButton>Close</TextButton>
        </AlertDialog.Cancel>
      </>
    );
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => (next ? askReset(true) : dismiss())}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={DIALOG_OVERLAY} />
        <AlertDialog.Content
          className={DIALOG_CONTENT}
          onEscapeKeyDown={(event) => {
            if (mustAnswer) {
              event.preventDefault();
            }
          }}
        >
          <AlertDialog.Title className={DIALOG_TITLE}>Put everything back?</AlertDialog.Title>
          <AlertDialog.Description className={DESCRIPTION}>
            {asker}Every picture returns to its wall, and every room to its size and name. This
            cannot be undone.
            {proposal === undefined && !alone ? " Everyone here has to agree first." : ""}
          </AlertDialog.Description>
          {proposal !== undefined && (
            <p className={STATUS} aria-live="polite">
              {statusOf(tally, proposal)}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">{buttons}</div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
