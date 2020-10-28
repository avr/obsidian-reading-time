import { Plugin, PluginSettingTab, Setting } from "obsidian"

import ReadTime from "reading-time"

export default class ReadingTime extends Plugin {
  settings: ReadingTimeSettings
  statusBar: HTMLElement

  onInit() { }

  async onload() {
    console.log("loading plugin")

    this.settings = (await this.loadData()) || new ReadingTimeSettings()
    this.statusBar = this.addStatusBarItem()

    this.addSettingTab(new ReadingTimeSettingsTab(this.app, this))
    this.app.workspace.on("file-open", this.calculateReadingTime)
    this.app.on("codemirror", this.codeMirror)
  }

  onunload() {
    console.log("unloading plugin")
    this.app.workspace.off("file-open", this.calculateReadingTime)
    this.app.off("codemirror", this.codeMirror)
  }

  codeMirror = (cm: any) => {
    cm.on("change", this.calculateReadingTime)
  }

  calculateReadingTime = (e: any) => {
    let leaf: any = this.app.workspace.activeLeaf

    if (leaf != null) {
      let stats = ReadTime(leaf.view.data, {
        wordsPerMinute: this.settings.readingSpeed,
      })
      this.statusBar.setText(`${stats.text}`)
    }
  }
}

class ReadingTimeSettings {
  readingSpeed: number = 200
}

class ReadingTimeSettingsTab extends PluginSettingTab {
  display(): void {
    let { containerEl } = this
    const plugin: any = (this as any).plugin

    containerEl.empty()

    containerEl.createEl("h2", { text: "Settings for Reading Time" })

    new Setting(containerEl)
      .setName("Reading speed")
      .setDesc("Words per minute used for reading speed (default: 200).")
      .addText((text) =>
        text
          .setPlaceholder("Example: 200")
          .setValue((plugin.settings.readingSpeed || "") + "")
          .onChange((value) => {
            console.log("Reading Speeding: " + value)
            plugin.settings.readingSpeed = parseInt(value.trim())
            plugin.saveData(plugin.settings)
            plugin.calculateReadingTime()
          })
      )
  }
}
