"use client";

import { useChat } from "@ai-sdk/react";
import { type FormEvent, useId, useState } from "react";
import type { ChatAgentUIMessage } from "@/lib/ai/agent";
import { MAX_USER_TEXT_CHARS } from "@/lib/ai/limits";
import { isProvider, PROVIDER_LABELS, PROVIDERS, type Provider } from "@/lib/ai/providers";
import styles from "./Chat.module.css";

interface ChatProps {
	defaultProvider: Provider;
}

export function Chat({ defaultProvider }: ChatProps) {
	const [input, setInput] = useState("");
	const [provider, setProvider] = useState<Provider>(defaultProvider);
	const { messages, sendMessage, status, stop, error } = useChat<ChatAgentUIMessage>();
	const providerSelectId = useId();
	const isBusy = status === "submitted" || status === "streaming";

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const text = input.trim();
		if (!text || isBusy) return;
		sendMessage({ text }, { body: { provider } });
		setInput("");
	}

	return (
		<section className={styles.chat} aria-label="Chat">
			<ol className={styles.messages} aria-live="polite">
				{messages.map((message) => (
					<li key={message.id} className={styles.message} data-role={message.role}>
						<span className={styles.role}>{message.role === "user" ? "You" : "AI"}</span>
						{message.parts.map((part, index) => {
							const key = `${message.id}-${index}`;
							switch (part.type) {
								case "text":
									return (
										<p key={key} className={styles.text}>
											{part.text}
										</p>
									);
								case "tool-getCurrentTime":
									return (
										<p key={key} className={styles.tool}>
											{part.state === "output-available"
												? `🕒 ${part.output.formatted}`
												: part.state === "output-error"
													? `⚠️ ${part.errorText}`
													: "🕒 Checking the time…"}
										</p>
									);
								default:
									return null;
							}
						})}
					</li>
				))}
			</ol>

			{error && (
				<p role="alert" className={styles.error}>
					Something went wrong. Check the server logs and your provider settings.
				</p>
			)}

			<form className={styles.form} onSubmit={handleSubmit}>
				<label htmlFor={providerSelectId} className={styles.visuallyHidden}>
					Provider
				</label>
				<select
					id={providerSelectId}
					value={provider}
					onChange={(event) => {
						const { value } = event.currentTarget;
						if (isProvider(value)) setProvider(value);
					}}
					disabled={isBusy}
				>
					{PROVIDERS.map((id) => (
						<option key={id} value={id}>
							{PROVIDER_LABELS[id]}
						</option>
					))}
				</select>
				<input
					className={styles.input}
					value={input}
					onChange={(event) => setInput(event.currentTarget.value)}
					placeholder="Ask something…"
					maxLength={MAX_USER_TEXT_CHARS}
					aria-label="Message"
				/>
				{isBusy ? (
					<button type="button" onClick={() => stop()}>
						Stop
					</button>
				) : (
					<button type="submit" disabled={!input.trim()}>
						Send
					</button>
				)}
			</form>
		</section>
	);
}
