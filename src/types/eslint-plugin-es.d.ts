declare module "eslint-plugin-es" {
  type RulesRecord = import("eslint").Linter.RulesRecord
  type RuleDefinition = import("eslint").Rule.RuleModule

  interface ConfigEntry {
    rules?: RulesRecord
  }

  interface EsPlugin {
    configs: Record<string, ConfigEntry>
    rules?: Record<string, RuleDefinition>
  }

  const plugin: EsPlugin
  export default plugin
}
