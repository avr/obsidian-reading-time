import ReadTime from "./lib/reading-time";
import PrettyMilliseconds from "pretty-ms";
import ReadingTime from "./main";

export function readingTimeText(text: string, plugin: ReadingTime) {
  const result = ReadTime(text, {
    wordsPerMinute: plugin.settings.readingSpeed,
  });
  let options: PrettyMilliseconds.Options = {
    secondsDecimalDigits: 0,
  };
  switch (plugin.settings.format) {
    case "simple":
      break;
    case "compact":
      if (result.time > 3600000) {
        options = { ...options, unitCount: 2 };
      } else {
        options = { ...options, compact: true };
      }
      break;
    case "verbose":
      options = { ...options, verbose: true };
      break;
    case "digital":
      options = { ...options, colonNotation: true };
      break;
    case "default":
      return plugin.settings.appendText
        ? `${result.minutes} min read`
        : `${result.minutes} min`;
  }
  const output = PrettyMilliseconds(result.time, options);
  return plugin.settings.appendText
    ? `${output} ${plugin.settings.appendText}`
    : output;
}
