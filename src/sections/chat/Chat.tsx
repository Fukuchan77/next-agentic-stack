"use client";

import { useChat } from "@ai-sdk/react";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { ChatAgentUIMessage } from "@/lib/ai/agent";
import { MAX_USER_TEXT_CHARS } from "@/lib/ai/limits";
import { isProvider, PROVIDER_LABELS, PROVIDERS, type Provider } from "@/lib/ai/providers";
import { cn } from "@/lib/utils";

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
		<section className="grid gap-4" aria-label="Chat">
			<ol className="m-0 grid list-none gap-3 p-0" aria-live="polite">
				{messages.map((message) => (
					<li
						key={message.id}
						className={cn(
							"rounded-lg bg-muted px-4 py-3",
							message.role === "user" && "border-l-[3px] border-primary",
						)}
						data-role={message.role}
					>
						<span className="text-xs font-semibold text-muted-foreground uppercase">
							{message.role === "user" ? "You" : "AI"}
						</span>
						{message.parts.map((part, index) => {
							const key = `${message.id}-${index}`;
							switch (part.type) {
								case "text":
									return (
										<p key={key} className="mt-1 whitespace-pre-wrap">
											{part.text}
										</p>
									);
								case "tool-getCurrentTime":
									return (
										<p key={key} className="mt-1 font-mono text-sm text-muted-foreground">
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
				<p role="alert" className="text-destructive">
					Something went wrong. Check the server logs and your provider settings.
				</p>
			)}

			<form className="flex gap-2" onSubmit={handleSubmit}>
				<label htmlFor={providerSelectId} className="sr-only">
					Provider
				</label>
				<NativeSelect
					id={providerSelectId}
					value={provider}
					onChange={(event) => {
						const { value } = event.currentTarget;
						if (isProvider(value)) setProvider(value);
					}}
					disabled={isBusy}
				>
					{PROVIDERS.map((id) => (
						<NativeSelectOption key={id} value={id}>
							{PROVIDER_LABELS[id]}
						</NativeSelectOption>
					))}
				</NativeSelect>
				<Input
					className="flex-1"
					value={input}
					onChange={(event) => setInput(event.currentTarget.value)}
					placeholder="Ask something…"
					maxLength={MAX_USER_TEXT_CHARS}
					aria-label="Message"
				/>
				{isBusy ? (
					<Button type="button" variant="outline" onClick={() => stop()}>
						Stop
					</Button>
				) : (
					<Button type="submit" disabled={!input.trim()}>
						Send
					</Button>
				)}
			</form>
		</section>
	);
}
