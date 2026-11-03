import { Box, Text, type TUI } from "@earendil-works/pi-tui";
import type { ExtensionAPI, ExtensionContext } from "../core/extensions/types.ts";
import type { Theme } from "../modes/interactive/theme/theme.ts";

const BANNER_ENTRY = "battlestar-banner";
const BANNER_WIDGET = "battlestar-banner-clock";
const FRAME_INTERVAL_MS = 180;
const ENGINE_FRAMES = ["==", "**", "~~", "=="];

let frame = 0;

function renderBanner(theme: Theme) {
	const engine = ENGINE_FRAMES[frame % ENGINE_FRAMES.length]!;
	const art = ["       /\\", "  ____/==\\____", `${theme.fg("warning", engine)}<___|==|___/==>`, "       \\__/"];
	const lines = [
		theme.fg("accent", theme.bold("BATTLESTAR GALACTICA")),
		"",
		...art,
		"",
		theme.fg("muted", "Colonial Viper on patrol"),
	];
	const box = new Box(1, 0);
	box.addChild(new Text(lines.join("\n"), 0, 0));
	return box;
}

function animateBanner(ctx: ExtensionContext): void {
	frame = 0;
	ctx.ui.setWidget(
		BANNER_WIDGET,
		(tui: TUI) => {
			const timer = setInterval(() => {
				if (tui.render(tui.terminal.columns).length > tui.terminal.rows) {
					clearInterval(timer);
					frame = ENGINE_FRAMES.length - 1;
					tui.requestRender();
					return;
				}
				frame++;
				tui.requestRender();
			}, FRAME_INTERVAL_MS);
			timer.unref?.();
			return {
				render: () => [],
				invalidate: () => {},
				dispose: () => clearInterval(timer),
			};
		},
		{ placement: "belowEditor" },
	);
}

export default function battlestarBannerExtension(pi: ExtensionAPI): void {
	pi.registerEntryRenderer(BANNER_ENTRY, (_entry, _options, theme) => renderBanner(theme));
	pi.on("session_start", (_event, ctx) => {
		if (!ctx.hasUI) return;
		const hasBanner = ctx.sessionManager
			.getEntries()
			.some((entry) => entry.type === "custom" && entry.customType === BANNER_ENTRY);
		if (!hasBanner) pi.appendEntry(BANNER_ENTRY, {});
		animateBanner(ctx);
	});
}
