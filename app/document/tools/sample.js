const {tools, toolbar} = require("../ui/ui");
const mouse = require("../input/mouse");
const keyboard = require("../input/keyboard");
const palette = require("../palette");
const doc = require("../doc");
let enabled = false;

tools.on("start", (mode) => {
    enabled = (mode == tools.modes.SAMPLE);
    if (enabled) toolbar.show_sample();
});

mouse.on("down", (x, y, half_y, is_legal) => {
    if (!enabled || !is_legal) return;
    const block = doc.at(x, y);
    tools.change_to_previous_mode();
    palette.fg = block.fg;
    palette.bg = block.bg;
});

mouse.on("move", (x, y, half_y, is_legal) => {
    if (!enabled || !is_legal) return;
    toolbar.set_sample(x, y);
});

keyboard.on("escape", () => {
    if (!enabled) return;
    palette.select_attribute();
});
