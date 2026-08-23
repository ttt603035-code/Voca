import {
  ClipboardPaste,
  FileSpreadsheet,
  FileText,
  FileUp,
  Loader2,
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import { useT } from "@/lib/i18n"
import type { ImportPayload } from "@/lib/import-vocab"
import { parseCsv, parseTxt, parseXlsx } from "@/lib/import-vocab"
import { AppleAlert, AppleButton, InsetGroup, ListRow } from "./kit/primitives"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { useVoca } from "@/store/voca-context"

export function ImportVocabSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { state, importVocabulary } = useVoca()
  const { t } = useT()

  const [step, setStep] = React.useState<"source" | "preview">("source")
  const [payload, setPayload] = React.useState<ImportPayload | null>(null)
  const [sourceName, setSourceName] = React.useState("")
  const [parsing, setParsing] = React.useState(false)
  const [pasteOpen, setPasteOpen] = React.useState(false)
  const [pasteText, setPasteText] = React.useState("")
  const [conflict, setConflict] = React.useState<string | null>(null)

  const csvRef = React.useRef<HTMLInputElement>(null)
  const xlsxRef = React.useRef<HTMLInputElement>(null)
  const txtRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setStep("source")
      setPayload(null)
      setSourceName("")
      setPasteOpen(false)
      setPasteText("")
      setConflict(null)
      setParsing(false)
    }
  }, [open])

  function finishParse(p: ImportPayload, name: string) {
    if (p.total === 0) {
      toast.error(t("importEmpty"))
      return
    }
    setPayload(p)
    setSourceName(name)
    setStep("preview")
  }

  async function handleFile(
    file: File,
    kind: "csv" | "xlsx" | "txt",
  ) {
    setParsing(true)
    try {
      if (kind === "csv") {
        finishParse(parseCsv(await file.text()), file.name)
      } else if (kind === "txt") {
        finishParse(parseTxt(await file.text()), file.name)
      } else {
        const p = await parseXlsx(await file.arrayBuffer())
        finishParse(p, file.name)
      }
    } catch {
      toast.error(t("parseError"))
    } finally {
      setParsing(false)
    }
  }

  function handlePaste() {
    finishParse(parseTxt(pasteText), t("pasteText"))
  }

  /** 冲突检测：是否已存在同名词库 */
  function conflictingBook(): string | null {
    if (!payload) return null
    for (const b of payload.books) {
      if (
        state.books.some(
          (x) => x.name.toLowerCase() === b.name.toLowerCase(),
        )
      ) {
        return b.name
      }
    }
    return null
  }

  function doImport(mode: "update" | "duplicate") {
    if (!payload) return
    importVocabulary(payload, mode)
    toast.success(t("importSuccess", { n: payload.total }))
    onClose()
  }

  function requestImport() {
    if (!payload) return
    const c = conflictingBook()
    if (c) {
      setConflict(c)
      return
    }
    doImport("update")
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] gap-0 overflow-y-auto rounded-t-[22px] p-0 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="sticky top-0 z-10 flex justify-center bg-background/90 pt-2.5 pb-1 backdrop-blur">
          <div className="h-1 w-9 rounded-full bg-foreground/20" />
        </div>

        <div className="px-5 pt-2 pb-6">
          {/* ── 步骤 1：选择来源 ── */}
          {step === "source" && (
            <div className="space-y-5">
              <h2 className="text-[20px] font-semibold">
                {t("importTitle")}
              </h2>
              <InsetGroup>
                <ListRow
                  icon={FileUp}
                  tint="#007AFF"
                  primary={t("importCsv")}
                  secondary={t("csvHint")}
                  as="button"
                  onClick={() => csvRef.current?.click()}
                  chevron
                />
                <ListRow
                  icon={FileSpreadsheet}
                  tint="#34C759"
                  primary={t("importExcel")}
                  secondary=".xlsx"
                  as="button"
                  onClick={() => xlsxRef.current?.click()}
                  chevron
                />
                <ListRow
                  icon={FileText}
                  tint="#FF9500"
                  primary={t("importTxt")}
                  secondary={t("txtHint")}
                  as="button"
                  onClick={() => txtRef.current?.click()}
                  chevron
                />
                <ListRow
                  icon={ClipboardPaste}
                  tint="#AF52DE"
                  primary={t("pasteText")}
                  as="button"
                  onClick={() => setPasteOpen((v) => !v)}
                />
              </InsetGroup>

              {pasteOpen && (
                <div className="space-y-3">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={t("pastePlaceholder")}
                    rows={8}
                    className="w-full rounded-[14px] bg-grouped p-4 text-[15px] leading-relaxed outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  <AppleButton onClick={handlePaste} disabled={!pasteText.trim()}>
                    {t("importPreview")}
                  </AppleButton>
                </div>
              )}

              <input
                ref={csvRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f, "csv")
                  e.target.value = ""
                }}
              />
              <input
                ref={xlsxRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f, "xlsx")
                  e.target.value = ""
                }}
              />
              <input
                ref={txtRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f, "txt")
                  e.target.value = ""
                }}
              />

              {parsing && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t("importPreview")}…
                </div>
              )}
            </div>
          )}

          {/* ── 步骤 2：预览 ── */}
          {step === "preview" && payload && (
            <div className="space-y-5">
              <h2 className="text-[20px] font-semibold">
                {t("importPreview")}
              </h2>
              <p className="-mt-3 text-[14px] text-muted-foreground">
                {sourceName}
              </p>
              <InsetGroup dividers={false} className="divide-y-0 space-y-4 p-4">
                {payload.books.map((b) => (
                  <div key={b.name}>
                    <p className="text-[16px] font-semibold">{b.name}</p>
                    <div className="mt-1.5 space-y-1">
                      {b.lists.map((l) => (
                        <div
                          key={l.name}
                          className="flex items-center justify-between text-[14px]"
                        >
                          <span className="text-muted-foreground">
                            {l.name}
                          </span>
                          <span className="tabular-nums">
                            {l.words.length} {t("wordsNoun")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-3 text-[15px] font-medium">
                  <span>{t("total")}</span>
                  <span className="tabular-nums">
                    {t("totalWords", { n: payload.total })}
                  </span>
                </div>
              </InsetGroup>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("source")}
                  className="h-12 flex-1 rounded-[12px] bg-grouped text-[17px] font-medium"
                >
                  {t("cancel")}
                </button>
                <AppleButton onClick={requestImport} className="flex-1">
                  {t("import")}
                </AppleButton>
              </div>
            </div>
          )}
        </div>

        <SheetTitle className="sr-only">{t("importTitle")}</SheetTitle>

        {/* 冲突处理 */}
        <AppleAlert
          open={!!conflict}
          onOpenChange={(o) => !o && setConflict(null)}
          title={t("alreadyExistsTitle")}
          description={
            conflict ? t("alreadyExistsDesc", { name: conflict }) : undefined
          }
          rows={[
            {
              label: t("updateExisting"),
              onClick: () => doImport("update"),
            },
            {
              label: t("createDuplicate"),
              onClick: () => doImport("duplicate"),
            },
            {
              label: t("cancel"),
              onClick: () => undefined,
            },
          ]}
        />
      </SheetContent>
    </Sheet>
  )
}
