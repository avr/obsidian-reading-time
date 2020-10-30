import { Plugin, PluginSettingTab, Setting } from "obsidian"

import ReadTime from "reading-time"

export default class ReadingTime extends Plugin {
  settings: ReadingTimeSettings
  statusBar: HTMLElement

  async onload() {
    this.settings = (await this.loadData()) || new ReadingTimeSettings()
    this.statusBar = this.addStatusBarItem()
    this.statusBar.setText("")

    this.addSettingTab(new ReadingTimeSettingsTab(this.app, this))

    this.registerEvent(
      this.app.workspace.on("file-open", this.calculateReadingTime)
    )
    this.registerEvent(this.app.on("codemirror", this.codeMirror))
  }

  codeMirror = (cm: any) => {
    cm.on("change", this.calculateReadingTime)
  }

  calculateReadingTime = (e: any) => {
    let view: any = this.app.workspace.activeLeaf.view

    if (view && view.data) {
      let stats = ReadTime(view.data, {
        wordsPerMinute: this.settings.readingSpeed,
      })
      this.statusBar.setText(`${stats.text}`)
    } else {
      this.statusBar.setText("")
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
