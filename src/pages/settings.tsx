import {
  Cloud,
  Dices,
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
  InsetGroup,
  LargeTitle,
  ListRow,
  SegmentedControl,
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
import { ACCENTS, DEFAULT_ACCENT_ID } from "@/lib/accents"
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

  function randomAccent() {
    const others = ACCENTS.filter((a) => a.id !== accentId)
    const next = others[Math.floor(Math.random() * others.length)]
    setAccent(next.id)
    toast(t("accentSet"))
  }

  return (
    <div className="space-y-7">
      <LargeTitle title={t("settings")} />

      {/* Language */}
      <section className="space-y-2.5">
        <GroupHeader>{t("language")}</GroupHeader>
        <InsetGroup>
          <ListRow
            as="button"
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
        </InsetGroup>
      </section>

      {/* Vocabulary */}
      <section className="space-y-2.5">
        <GroupHeader>{t("vocabularySection")}</GroupHeader>
        <InsetGroup>
          <ListRow
            icon={Import}
            tint="#007AFF"
            as="button"
            onClick={() => setImportOpen(true)}
            primary={t("importVocabulary")}
            secondary="CSV / Excel / TXT"
            chevron
          />
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[17px]">{t("newWordsPerSession")}</p>
              <p className="text-[13px] text-muted-foreground">
                {t("newWordsPerSessionDesc")}
              </p>
            </div>
            <Stepper
              value={state.settings.dailyGoal}
              onChange={setDailyGoal}
              min={1}
              max={100}
            />
          </div>
        </InsetGroup>
      </section>

      {/* Appearance */}
      <section className="space-y-2.5">
        <GroupHeader>{t("appearanceSection")}</GroupHeader>
        <InsetGroup>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-[17px]">{t("theme")}</span>
            <SegmentedControl
              value={theme}
              onChange={(v) => setTheme(v as "light" | "dark" | "system")}
              options={[
                { value: "light", label: t("light") },
                { value: "system", label: t("auto") },
                { value: "dark", label: t("dark") },
              ]}
            />
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[17px]">{t("accentColor")}</span>
              <button
                type="button"
                onClick={randomAccent}
                className="flex items-center gap-1 text-[15px] text-primary"
              >
                <Dices className="size-4" />
                {t("random")}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-3">
              {ACCENTS.map((a) => {
                const active = (accentId ?? DEFAULT_ACCENT_ID) === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAccent(a.id)}
                    aria-label={a.name}
                    className={cn(
                      "mx-auto size-8 rounded-full transition-transform",
                      active
                        ? "scale-100 ring-2 ring-foreground/60 ring-offset-2 ring-offset-background"
                        : "active:scale-90",
                    )}
                    style={{
                      backgroundColor: theme === "dark" ? a.dark : a.light,
                    }}
                  />
                )
              })}
            </div>
          </div>
        </InsetGroup>
      </section>

      {/* Sound */}
      <section className="space-y-2.5">
        <GroupHeader>{t("soundSection")}</GroupHeader>
        <InsetGroup>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[17px]">{t("pronunciation")}</span>
            <Switch
              checked={state.settings.sound}
              onCheckedChange={(on) => setSound(on as boolean)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-[17px]">{t("voice")}</span>
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
          </div>
        </InsetGroup>
      </section>

      {/* Gemini API */}
      <section className="space-y-2.5">
        <GroupHeader>{t("geminiSection")}</GroupHeader>
        <InsetGroup>
          <ListRow
            icon={Cloud}
            tint="#AF52DE"
            as="button"
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
        </InsetGroup>
      </section>

      {/* Data */}
      <section className="space-y-2.5">
        <GroupHeader>{t("dataSection")}</GroupHeader>
        <InsetGroup>
          <ListRow
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
          <ListRow
            icon={Download}
            tint="#34C759"
            as="button"
            onClick={() => {
              exportData(state)
              toast.success(t("exportDone"))
            }}
            primary={t("exportData")}
            chevron
          />
          <ListRow
            icon={Trash2}
            tint="#FF3B30"
            as="button"
            onClick={() => setConfirmReset(true)}
            primary={<span className="text-destructive">{t("resetAll")}</span>}
          />
        </InsetGroup>
      </section>

      {/* About */}
      <section className="space-y-2.5">
        <GroupHeader>{t("aboutSection")}</GroupHeader>
        <InsetGroup>
          <ListRow
            icon={ShieldCheck}
            tint="#8E8E93"
            primary="Voca"
            secondary={`${t("appDesc")} · ${t("version")} 1.0`}
          />
        </InsetGroup>
      </section>

      {/* 语言选择 Sheet */}
      <Sheet open={langSheet} onOpenChange={setLangSheet}>
        <SheetContent
          side="bottom"
          className="gap-0 rounded-t-[22px] p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="sticky top-0 z-10 flex justify-center bg-background/90 pt-2.5 pb-1 backdrop-blur">
            <div className="h-1 w-9 rounded-full bg-foreground/20" />
          </div>
          <div className="px-5 pt-2 pb-6">
            <h2 className="mb-3 text-[20px] font-semibold">{t("language")}</h2>
            <InsetGroup>
              {(["zh", "en"] as Lang[]).map((l) => (
                <ListRow
                  key={l}
                  as="button"
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
            </InsetGroup>
          </div>
          <SheetTitle className="sr-only">{t("language")}</SheetTitle>
        </SheetContent>
      </Sheet>

      {/* API Key Sheet */}
      <Sheet open={keySheet} onOpenChange={setKeySheet}>
        <SheetContent
          side="bottom"
          className="gap-0 overflow-y-auto rounded-t-[22px] p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="sticky top-0 z-10 flex justify-center bg-background/90 pt-2.5 pb-1 backdrop-blur">
            <div className="h-1 w-9 rounded-full bg-foreground/20" />
          </div>
          <div className="space-y-4 px-5 pt-2 pb-6">
            <h2 className="text-[20px] font-semibold">{t("geminiKey")}</h2>
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="AIza…"
              className="h-11 w-full rounded-[10px] bg-grouped px-3 text-[15px] outline-none focus:ring-2 focus:ring-ring/40"
            />
            <p className="text-[13px] leading-snug text-muted-foreground">
              {t("keyHint")}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setGeminiKey("")
                  setKeyDraft("")
                  toast(t("keyCleared"))
                }}
                disabled={!hasKey && !keyDraft}
                className="h-12 flex-1 rounded-[12px] bg-grouped text-[17px] font-medium disabled:opacity-40"
              >
                {t("clear")}
              </button>
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
