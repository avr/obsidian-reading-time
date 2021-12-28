import { App, MarkdownView, Plugin, PluginSettingTab, Setting, debounce, Editor, Modal } from "obsidian"
import ReadTime from "reading-time"
interface ReadingTimeSettings {
	readingSpeed: number;
}

const DEFAULT_SETTINGS: ReadingTimeSettings = {
  readingSpeed: 200
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
      const stats = this.readingTime(mdView.getViewData())
      this.statusBar.setText(`${stats.text}`)
    } else {
      this.statusBar.setText("0 min read")
    }
  }

  readingTime(text: string) {
    return ReadTime(text, {
      wordsPerMinute: this.settings.readingSpeed,
    })
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
		contentEl.setText(`${stats.text} (at ${this.plugin.settings.readingSpeed} wpm)`);
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
      .addText(text => text
          .setPlaceholder("Example: 200")
          .setValue(this.plugin.settings.readingSpeed.toString())
          .onChange(async (value) => {
            this.plugin.settings.readingSpeed = parseInt(value.trim())
            await this.plugin.saveSettings()
            this.plugin.calculateReadingTime
          })
      )
  }
}
