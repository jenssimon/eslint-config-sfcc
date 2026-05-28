import type { Rule } from "eslint"

import type { SfccSettings } from "../../types/sfcc-settings.js"

type RuleContextWithSettings = Rule.RuleContext & {
  settings?: { sfcc?: SfccSettings }
}

export function getSfccSettings(context: Rule.RuleContext): SfccSettings {
  return (context as RuleContextWithSettings).settings?.sfcc ?? {}
}

export function withSfccSettings(
  createWithSettings: (context: Rule.RuleContext, sfccSettings: SfccSettings) => Rule.RuleListener,
): (context: Rule.RuleContext) => Rule.RuleListener {
  return (context) => createWithSettings(context, getSfccSettings(context))
}
