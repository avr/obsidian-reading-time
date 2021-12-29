import { App, MarkdownView, Plugin, PluginSettingTab, Setting, debounce, Editor, Modal } from "obsidian"
import ReadTime from "reading-time"
import PrettyMilliseconds from "pretty-ms"
interface ReadingTimeSettings {
	readingSpeed: number;
  format: string;
  appendText: string;
}

const DEFAULT_SETTINGS: ReadingTimeSettings = {
  readingSpeed: 200,
  format: 'default',
  appendText: 'read'
}
export default class ReadingTime extends Plugin {
  settings: ReadingTimeSettings
  statusBar: HTMLElement

  async onload() {
    await this.loadSettings();

    this.statusBar = this.addStatusBarItem()
    this.statusBar.setText("")

    this.addSettingTab(new ReadingTimeSettingsTab(this.app, this))

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'reading-time-editor-command',
			name: 'Selected Text',
			editorCallback: (editor: Editor, view: MarkdownView) => {
        new ReadingTimeModal(this.app, editor, this).open();
			}
		});

    this.registerEvent(
      this.app.workspace.on("file-open", this.calculateReadingTime)
    )

    this.registerEvent(
      this.app.workspace.on("editor-change", debounce(this.calculateReadingTime, 1000))
    )
  }

  calculateReadingTime = () => {
    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (mdView && mdView.getViewData()) {
      const result = this.readingTime(mdView.getViewData())
      this.statusBar.setText(`${result}`)
    } else {
      this.statusBar.setText("0 min read")
    }
  }

  readingTime(text: string) {
    const result = ReadTime(text, {
      wordsPerMinute: this.settings.readingSpeed,
    })
    let options:any = {
      secondsDecimalDigits: 0
    }
    switch (this.settings.format) {
      case 'simple':
        break;
      case 'compact':
        if (result.time > 3600000) {
          options.unitCount = 2;
        } else {
          options.compact = true
        }
        break;
      case 'verbose':
        options.verbose = true;
        break;
      case 'digital':
        options.colonNotation = true;
        break;
      case 'default':
        return this.settings.appendText ? result.text : result.text.replace(' read', '');
    }
    let output = PrettyMilliseconds(result.time, options)
    return this.settings.appendText ? `${output} ${this.settings.appendText}` : output;
  }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ReadingTimeModal extends Modal {

  plugin: ReadingTime;
  editor: Editor;

  constructor(app: App, editor: Editor, plugin: ReadingTime) {
    super(app);
    this.editor = editor;
    this.plugin = plugin;
	}

	onOpen() {
		const {contentEl, titleEl} = this;
    const stats = this.plugin.readingTime(this.editor.getSelection())
    titleEl.setText('Reading Time of Selected Text')
		contentEl.setText(`${stats} (at ${this.plugin.settings.readingSpeed} wpm)`);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class ReadingTimeSettingsTab extends PluginSettingTab {

  plugin: ReadingTime;

	constructor(app: App, plugin: ReadingTime) {
		super(app, plugin);
		this.plugin = plugin;
	}

  display(): void {
		const {containerEl} = this;

    containerEl.empty()

    new Setting(containerEl)
      .setName("Reading speed")
      .setDesc("Words per minute used for reading speed (default: 200).")
      .addText((text) => {
        text.setPlaceholder("Example: 200")
          .setValue(this.plugin.settings.readingSpeed.toString())
          .onChange(async (value) => {
            this.plugin.settings.readingSpeed = parseInt(value.trim())
            await this.plugin.saveSettings()
              .then( this.plugin.calculateReadingTime )
          })
      });

    new Setting(this.containerEl)
      .setName("Format")
      .setDesc("Choose the output format")
      .addDropdown(dropdown => dropdown
        .addOption("default", "Default (10 min)")
        .addOption("compact", "Compact (10m)")
        .addOption("simple", "Simple (10m 4s)")
        .addOption("verbose", "Verbose (10 minutes 4 seconds)")
        .addOption("digital", "Colon Notation (10:04)")
        .setValue(this.plugin.settings.format)
        .onChange(async (value) => {
          this.plugin.settings.format = value;
          await this.plugin.saveSettings()
            .then( this.plugin.calculateReadingTime )
        })
      );

    new Setting(this.containerEl)
      .setName("Append Text")
      .setDesc("Append 'read' to formatted string.")
      .addText(text => text
        .setValue(this.plugin.settings.appendText)
        .onChange(async (value) => {
          this.plugin.settings.appendText = value.trim();
          await this.plugin.saveSettings()
            .then( this.plugin.calculateReadingTime )
        })
      );
  }
}
