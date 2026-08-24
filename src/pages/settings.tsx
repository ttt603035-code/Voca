import {
  Cloud,
  Download,
  Import,
  ShieldCheck,
  Trash2,
  Wifi,
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import {
  GroupHeader,
  LargeTitle,
  Stepper,
} from "@/components/kit/primitives"
import { AppleAlert, AppleButton } from "@/components/kit/primitives"
import { ImportVocabSheet } from "@/components/import-vocab-sheet"
import { useTheme } from "@/components/theme-provider"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  GlassGroup,
  GlassItem,
} from "@/components/ui/glass-item"
import {
  GlassToggleGroup,
  GlassToggleItem,
} from "@/components/ui/glass-toggle-group"
import { ACCENTS, DEFAULT_ACCENT_ID, getAccent } from "@/lib/accents"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useVoca } from "@/store/voca-context"
import type { Lang } from "@/lib/types"

function exportData(state: unknown) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `voca-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** A glass row used for inline controls (stepper / switch) with no chevron. */
function ControlRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[48px] w-full items-center justify-between gap-3 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[16px] leading-tight tracking-[-0.01em]">{label}</p>
        {description && (
          <p className="mt-0.5 text-[13px] leading-tight text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const {
    state,
    setDailyGoal,
    setAccent,
    setGeminiKey,
    setLanguage,
    setVoice,
    setSound,
    resetAll,
  } = useVoca()
  const { theme, setTheme } = useTheme()
  const { t, lang } = useT()

  const [langSheet, setLangSheet] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [keySheet, setKeySheet] = React.useState(false)
  const [keyDraft, setKeyDraft] = React.useState(state.settings.geminiKey)
  const [confirmReset, setConfirmReset] = React.useState(false)

  const accentId = state.settings.accentId
  const storageKB = (JSON.stringify(state).length / 1024).toFixed(1)
  const hasKey = !!state.settings.geminiKey
  const langName = lang === "zh" ? "中文" : "English"

  return (
    <div className="space-y-7">
      <LargeTitle title={t("settings")} />

      {/* Language */}
      <section className="space-y-3">
        <GroupHeader>{t("language")}</GroupHeader>
        <GlassGroup>
          <GlassItem
            onClick={() => setLangSheet(true)}
            primary={t("language")}
            secondary={t("languageDesc")}
            trailing={
              <span className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
                {langName}
                <svg className="size-4 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            }
          />
        </GlassGroup>
      </section>

      {/* Vocabulary */}
      <section className="space-y-3">
        <GroupHeader>{t("vocabularySection")}</GroupHeader>
        <GlassGroup>
          <GlassItem
            icon={Import}
            tint="#007AFF"
            onClick={() => setImportOpen(true)}
            primary={t("importVocabulary")}
            secondary="CSV / Excel / TXT"
            chevron
          />
          <ControlRow
            label={t("newWordsPerSession")}
            description={t("newWordsPerSessionDesc")}
          >
            <Stepper
              value={state.settings.dailyGoal}
              onChange={setDailyGoal}
              min={1}
              max={100}
            />
          </ControlRow>
        </GlassGroup>
      </section>

      {/* Appearance */}
      <section className="space-y-3">
        <GroupHeader>{t("appearanceSection")}</GroupHeader>
        <GlassGroup>
          <div className="flex flex-col gap-3 px-3.5 py-3.5">
            <span className="text-[16px] tracking-[-0.01em]">{t("theme")}</span>
            <GlassToggleGroup
              value={theme}
              onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
              tint={0.2}
              className="w-full"
            >
              <GlassToggleItem value="light" className="flex-1 justify-center">
                {t("light")}
              </GlassToggleItem>
              <GlassToggleItem value="system" className="flex-1 justify-center">
                {t("auto")}
              </GlassToggleItem>
              <GlassToggleItem value="dark" className="flex-1 justify-center">
                {t("dark")}
              </GlassToggleItem>
            </GlassToggleGroup>
          </div>
          <GlassItem
            primary={t("themeColor")}
            secondary={getAccent(accentId).name}
            trailing={
              <>
                <span
                  className="size-4 rounded-full border border-border/70"
                  style={{
                    backgroundColor:
                      theme === "dark"
                        ? getAccent(accentId).dark
                        : getAccent(accentId).light,
                  }}
                />
                <Select
                  value={accentId ?? DEFAULT_ACCENT_ID}
                  onValueChange={(v) => {
                    setAccent(v)
                    toast(t("accentSet"))
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-9 min-w-0 gap-2 border-0 bg-transparent px-2 shadow-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCENTS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-2.5">
                          <span
                            className="size-3.5 rounded-full border border-border/70"
                            style={{ backgroundColor: a.light }}
                          />
                          {a.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        </GlassGroup>
      </section>

      {/* Sound */}
      <section className="space-y-3">
        <GroupHeader>{t("soundSection")}</GroupHeader>
        <GlassGroup>
          <ControlRow label={t("pronunciation")}>
            <Switch
              checked={state.settings.sound}
              onCheckedChange={(on) => setSound(on as boolean)}
            />
          </ControlRow>
          <ControlRow label={t("voice")}>
            <Select
              value={state.settings.voice}
              onValueChange={(v) => setVoice(v as "en-US" | "en-GB")}
              disabled={!state.settings.sound}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">{t("voiceUS")}</SelectItem>
                <SelectItem value="en-GB">{t("voiceUK")}</SelectItem>
              </SelectContent>
            </Select>
          </ControlRow>
        </GlassGroup>
      </section>

      {/* Gemini API */}
      <section className="space-y-3">
        <GroupHeader>{t("geminiSection")}</GroupHeader>
        <GlassGroup>
          <GlassItem
            icon={Cloud}
            tint="#AF52DE"
            onClick={() => {
              setKeyDraft(state.settings.geminiKey)
              setKeySheet(true)
            }}
            primary={t("geminiKey")}
            secondary={t("geminiKeyDesc")}
            trailing={
              <span
                className={cn(
                  "text-[14px]",
                  hasKey ? "text-[#34C759]" : "text-muted-foreground/60",
                )}
              >
                {hasKey ? t("keySet") : t("keyNotSet")}
              </span>
            }
            chevron
          />
        </GlassGroup>
      </section>

      {/* Data */}
      <section className="space-y-3">
        <GroupHeader>{t("dataSection")}</GroupHeader>
        <GlassGroup>
          <GlassItem
            icon={Wifi}
            tint="#32ADE6"
            primary={t("localStorage")}
            secondary={t("localStorageDesc")}
            trailing={
              <span className="text-[14px] tabular-nums text-muted-foreground">
                {storageKB} KB
              </span>
            }
          />
          <GlassItem
            icon={Download}
            tint="#34C759"
            onClick={() => {
              exportData(state)
              toast.success(t("exportDone"))
            }}
            primary={t("exportData")}
            chevron
          />
          <GlassItem
            icon={Trash2}
            tint="#FF3B30"
            onClick={() => setConfirmReset(true)}
            primary={<span className="text-destructive">{t("resetAll")}</span>}
          />
        </GlassGroup>
      </section>

      {/* About */}
      <section className="space-y-3">
        <GroupHeader>{t("aboutSection")}</GroupHeader>
        <GlassGroup>
          <GlassItem
            icon={ShieldCheck}
            tint="#8E8E93"
            primary="Voca"
            secondary={`${t("appDesc")} · ${t("version")} 1.0`}
          />
        </GlassGroup>
      </section>

      {/* 语言选择 Sheet */}
      <Sheet open={langSheet} onOpenChange={setLangSheet}>
        <SheetContent
          side="bottom"
          className="gap-0 rounded-t-[22px] border-0 bg-transparent p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="mx-3 mt-0">
            <GlassGroup radius={22} blur={26} tint={0.38} className="p-0">
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="h-1 w-9 rounded-full bg-foreground/20" />
              </div>
              <div className="px-3.5 pt-2 pb-5">
                <h2 className="mb-3 px-1 text-[20px] font-semibold">
                  {t("language")}
                </h2>
                <GlassGroup tint={0.2} blur={10} radius={14}>
                  {(["zh", "en"] as Lang[]).map((l) => (
                    <GlassItem
                      key={l}
                      onClick={() => {
                        setLanguage(l)
                        setLangSheet(false)
                        toast.success(t("languageSet"))
                      }}
                      primary={l === "zh" ? "中文" : "English"}
                      trailing={
                        lang === l ? (
                          <svg
                            className="size-5 text-[#34C759]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : undefined
                      }
                    />
                  ))}
                </GlassGroup>
              </div>
            </GlassGroup>
          </div>
          <SheetTitle className="sr-only">{t("language")}</SheetTitle>
        </SheetContent>
      </Sheet>

      {/* API Key Sheet */}
      <Sheet open={keySheet} onOpenChange={setKeySheet}>
        <SheetContent
          side="bottom"
          className="gap-0 overflow-y-auto rounded-t-[22px] border-0 bg-transparent p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="mx-3">
            <GlassGroup radius={22} blur={26} tint={0.38}>
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="h-1 w-9 rounded-full bg-foreground/20" />
              </div>
              <div className="space-y-4 px-4 pt-2 pb-5">
                <h2 className="text-[20px] font-semibold">{t("geminiKey")}</h2>
                <GlassGroup
                  as="div"
                  tint={0.2}
                  blur={10}
                  radius={12}
                  className="p-0"
                >
                  <input
                    type="password"
                    value={keyDraft}
                    onChange={(e) => setKeyDraft(e.target.value)}
                    placeholder="AIza…"
                    className="h-12 w-full bg-transparent px-4 text-[15px] outline-none"
                  />
                </GlassGroup>
                <p className="text-[13px] leading-snug text-muted-foreground">
                  {t("keyHint")}
                </p>
                <div className="flex gap-3">
                  <GlassGroup
                    as="button"
                    type="button"
                    onClick={() => {
                      setGeminiKey("")
                      setKeyDraft("")
                      toast(t("keyCleared"))
                    }}
                    disabled={!hasKey && !keyDraft}
                    tint={0.22}
                    blur={14}
                    radius={14}
                    className="h-12 flex-1 text-[17px] font-medium text-primary disabled:opacity-40"
                  >
                    {t("clear")}
                  </GlassGroup>
                  <AppleButton
                    onClick={() => {
                      setGeminiKey(keyDraft)
                      setKeySheet(false)
                      toast(
                        keyDraft.trim() ? t("keySaved") : t("keyCleared"),
                      )
                    }}
                    className="flex-1"
                  >
                    {t("save")}
                  </AppleButton>
                </div>
              </div>
            </GlassGroup>
          </div>
          <SheetTitle className="sr-only">{t("geminiKey")}</SheetTitle>
        </SheetContent>
      </Sheet>

      <ImportVocabSheet open={importOpen} onClose={() => setImportOpen(false)} />

      <AppleAlert
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t("resetAllTitle")}
        description={t("resetAllDesc")}
        confirmLabel={t("reset")}
        destructive
        onConfirm={() => {
          resetAll()
          toast.success(t("resetDone"))
        }}
      />
    </div>
  )
}
