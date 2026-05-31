import { fahrerDaten } from '../services/api'
import type { FahrerKontakt } from '../services/api'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, User } from 'lucide-react'

const fahrerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Bitte gib einen Namen mit mindestens 2 Zeichen ein.'),
  telefon: z
    .string()
    .trim()
    .min(5, 'Bitte gib eine Telefonnummer mit mindestens 5 Zeichen ein.')
})

type FahrerFormValues = z.infer<typeof fahrerFormSchema>

function FahrerPage() {
  const [extraFahrer, setExtraFahrer] = useState<FahrerKontakt[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FahrerFormValues>({
    resolver: zodResolver(fahrerFormSchema),
    defaultValues: { name: '', telefon: '' }
  })

  const onSubmit = handleSubmit((values) => {
    setExtraFahrer((prev) => {
      const ids = [...fahrerDaten, ...prev].map((f) => f.id)
      const nextId = (ids.length ? Math.max(...ids) : 0) + 1

      return [
        ...prev,
        {
          id: nextId,
          name: values.name,
          telefon: values.telefon
        }
      ]
    })
    reset({ name: '', telefon: '' })
  })

  const alleFahrer = useMemo(() => [...fahrerDaten, ...extraFahrer], [extraFahrer])

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Fahrer
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Kontaktliste der registrierten Fahrer.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <User className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Neuen Fahrer hinzufügen (lokal)
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Hinzufügen
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Name
              <input
                {...register('name')}
                className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="z.B. Max Mustermann"
              />
            </label>
            {errors.name?.message ? (
              <div className="mt-1 text-xs font-medium text-rose-600">
                {errors.name.message}
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Telefon
              <input
                {...register('telefon')}
                className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="z.B. 0123456789"
              />
            </label>
            {errors.telefon?.message ? (
              <div className="mt-1 text-xs font-medium text-rose-600">
                {errors.telefon.message}
              </div>
            ) : null}
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg ring-1 ring-slate-200">
        <ul className="divide-y divide-slate-200 bg-white">
          {alleFahrer.map((fahrer) => (
            <li
              key={fahrer.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">
                  {fahrer.name}
                </div>
                <div className="truncate text-sm text-slate-600">Telefon</div>
              </div>
              <div className="shrink-0 text-sm font-medium tabular-nums text-slate-900">
                {fahrer.telefon}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default FahrerPage