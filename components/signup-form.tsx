"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";

import { signUpAction, type ActionState } from "@/app/actions";

const initialState: ActionState = {
  ok: false,
  message: ""
};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initialState);

  return (
    <section className="panel signup">
      <div className="section-title">
        <div>
          <h2>Join the league</h2>
          <p className="muted">Use your Tomoro email so predictions can be ranked fairly.</p>
        </div>
      </div>
      <form action={action} className="field-grid">
        <label>
          First name
          <input name="firstName" autoComplete="given-name" required />
        </label>
        <label>
          Last name
          <input name="lastName" autoComplete="family-name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" placeholder="you@tomoro.ai" autoComplete="email" required />
        </label>
        <button className="primary-button" disabled={pending} type="submit">
          <LogIn size={18} /> {pending ? "Joining..." : "Start predicting"}
        </button>
        {state.message ? <p className={state.ok ? "muted" : ""}>{state.message}</p> : null}
      </form>
    </section>
  );
}
