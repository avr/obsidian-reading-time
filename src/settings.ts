import { App, PluginSettingTab, Setting } from "obsidian";
import ReadingTime from "./main";

export enum ReadingTimeFormat {
  Default = "default",
  Compact = "compact",
  Simple = "simple",
  Verbose = "verbose",
  Digital = "digital",
}

export interface ReadingTimeSettings {
  readingSpeed: number;
  format: ReadingTimeFormat;
  appendText: string;
  excludeComments: boolean;
  excludeHtmlTags: boolean;
}

export const RT_DEFAULT_SETTINGS: ReadingTimeSettings = {
  readingSpeed: 200,
  format: ReadingTimeFormat.Default,
  appendText: "read",
  excludeComments: false,
  excludeHtmlTags: false,
};

export class ReadingTimeSettingsTab extends PluginSettingTab {
  plugin: ReadingTime;

  constructor(app: App, plugin: ReadingTime) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Reading speed")
      .setDesc("Words per minute used for reading speed (default: 200).")
      .addText((text) => {
        text
          .setPlaceholder("Example: 200")
          .setValue(this.plugin.settings.readingSpeed.toString())
          .onChange(async (value) => {
            this.plugin.settings.readingSpeed = parseInt(value.trim());
            await this.plugin
              .saveSettings()
              .then(this.plugin.calculateReadingTime);
          });
      });

    new Setting(this.containerEl)
      .setName("Format")
      .setDesc("Choose the output format")
      .addDropdown((dropdown) =>
        dropdown
          .addOption(ReadingTimeFormat.Default, "Default (10 min)")
          .addOption(ReadingTimeFormat.Compact, "Compact (10m)")
          .addOption(ReadingTimeFormat.Simple, "Simple (10m 4s)")
          .addOption(
            ReadingTimeFormat.Verbose,
            "Verbose (10 minutes 4 seconds)"
          )
          .addOption(ReadingTimeFormat.Digital, "Colon Notation (10:04)")
          .setValue(this.plugin.settings.format)
          .onChange(async (value) => {
            this.plugin.settings.format = value as ReadingTimeFormat;
            await this.plugin
              .saveSettings()
              .then(this.plugin.calculateReadingTime);
          })
      );

    new Setting(this.containerEl)
      .setName("Append Text")
      .setDesc("Append 'read' to formatted string.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.appendText)
          .onChange(async (value) => {
            this.plugin.settings.appendText = value.trim();
            await this.plugin
              .saveSettings()
              .then(this.plugin.calculateReadingTime);
          })
      );

    new Setting(this.containerEl)
      .setName("Exclude comments")
      .setDesc("Omit %%comments%% from the reading time calculation.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.excludeComments)
          .onChange(async (value) => {
            this.plugin.settings.excludeComments = value;
            await this.plugin
              .saveSettings()
              .then(this.plugin.calculateReadingTime);
          })
      );

    new Setting(this.containerEl)
      .setName("Exclude HTML tags")
      .setDesc(
        "Omit HTML tag markup (e.g. <mark>, <br/>) from the calculation; text inside tags still counts."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.excludeHtmlTags)
          .onChange(async (value) => {
            this.plugin.settings.excludeHtmlTags = value;
            await this.plugin
              .saveSettings()
              .then(this.plugin.calculateReadingTime);
          })
      );
  }
}
