import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PassengerDetailsCard } from '../features/passengers/components/PassengerDetailsCard'
import { PassengerFormDialog } from '../features/passengers/components/PassengerFormDialog'
import { PassengerHeader } from '../features/passengers/components/PassengerHeader'
import { PassengerSearchBar } from '../features/passengers/components/PassengerSearchBar'
import { PassengerTable } from '../features/passengers/components/PassengerTable'
import {
  createEmptyForm,
  createFormFromGuest,
  filterGuests,
  toFahrgastUpsertRequest,
} from '../features/passengers/utils'
import {
  createFahrgast,
  deletePassenger,
  getFahrgaeste,
  updateFahrgast,
} from '../services/fahrgastApi'
import { getInitiativen } from '../services/initiativeApi'
import { useAuth } from '../context/AuthContext'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import type { Fahrgast, FahrgastFormData } from '../types/Fahrgast'
import type { Initiative } from '../types/Initiative'

function FahrgastinfosPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { canManageDataCrud, canManageInitiatives, isAdmin, isFahrer } = useRoleVisibility()
  const isCrudRestricted = !canManageDataCrud
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [guests, setGuests] = useState<Fahrgast[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [editError, setEditError] = useState('')
  const [createError, setCreateError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editForm, setEditForm] = useState<FahrgastFormData>(createEmptyForm())
  const [createForm, setCreateForm] = useState<FahrgastFormData>(createEmptyForm())
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [initiativesError, setInitiativesError] = useState('')

  const selectedGuest = guests.find((entry) => entry.id === selectedGuestId) ?? null
  const filteredGuests = filterGuests(guests, searchQuery)

  useEffect(() => {
    let isActive = true

    setIsLoading(true)
    setLoadError('')

    void getFahrgaeste()
      .then((loadedGuests) => {
        if (!isActive) {
          return
        }

        setGuests(loadedGuests)
        setSelectedGuestId(null)
      })
      .catch(() => {
        if (isActive) {
          setLoadError('Fahrgastdaten konnten nicht geladen werden.')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    let isActive = true
    setInitiativesError('')

    void getInitiativen()
      .then((loaded) => {
        if (isActive) {
          setInitiatives(loaded)
        }
      })
      .catch((err) => {
        if (isActive) {
          setInitiativesError(err instanceof Error ? err.message : 'Initiativen konnten nicht geladen werden.')
        }
      })

    return () => {
      isActive = false
    }
  }, [isAdmin])

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }

  function goToPage(path: string) {
    closeSideMenu()
    navigate(path)
  }

  function handleOpenEditModal() {
    if (isCrudRestricted) {
      return
    }

    if (!selectedGuest) {
      return
    }

    setEditForm(createFormFromGuest(selectedGuest))
    setEditError('')
    setIsEditModalOpen(true)
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false)
  }

  function handleEditFormChange(field: keyof FahrgastFormData, value: string) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleCreateFormChange(field: keyof FahrgastFormData, value: string) {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleSaveGuestChanges() {
    if (isCrudRestricted) {
      return
    }

    if (!selectedGuest) {
      return
    }

    setEditError('')
    setDeleteError('')

    try {
      const payload = toFahrgastUpsertRequest(editForm, { isAdmin })

      if (isAdmin) {
        if (!payload.initiativeId || payload.initiativeId <= 0) {
          setEditError('Bitte eine Initiative auswählen.')
          return
        }
      }

      const savedGuest = await updateFahrgast(selectedGuest.id, payload)
      setGuests((prev) =>
        prev.map((entry) => (entry.id === selectedGuest.id ? savedGuest : entry)).filter((entry) => entry.aktiv),
      )

      if (!savedGuest.aktiv) {
        setSelectedGuestId(null)
      }

      setIsEditModalOpen(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Fahrgast konnte nicht gespeichert werden.')
    }
  }

  async function handleDeleteGuest() {
    if (isCrudRestricted) {
      return
    }

    if (!selectedGuestId || !selectedGuest) {
      return
    }

    const shouldDelete = window.confirm('Sind Sie sicher, dass Sie diesen Fahrgast löschen möchten?')

    if (!shouldDelete) {
      return
    }

    setDeleteError('')

    try {
      console.info('Deleting passenger', { passengerId: selectedGuest.id, route: '/api/v1/fahrgaeste/:id' })
      await deletePassenger(selectedGuest.id)

      setGuests((prev) => prev.filter((entry) => entry.id !== selectedGuest.id))
      setSelectedGuestId(null)
    } catch (err) {
      console.error('Failed to delete passenger', {
        passengerId: selectedGuest.id,
        route: '/api/v1/fahrgaeste/:id',
        error: err,
      })
      setDeleteError(err instanceof Error ? err.message : 'Fahrgast konnte nicht gelöscht werden.')
    }
  }

  function handleOpenCreateModal() {
    if (isCrudRestricted) {
      return
    }

    const defaultInitiativeId = isAdmin && initiatives.length > 0 ? String(initiatives[0].id) : ''
    setCreateForm({
      ...createEmptyForm(),
      initiativeId: defaultInitiativeId,
    })
    setCreateError('')
    setIsCreateModalOpen(true)
  }

  function handleCloseCreateModal() {
    setIsCreateModalOpen(false)
  }

  async function handleCreateGuest() {
    if (isCrudRestricted) {
      return
    }

    setCreateError('')

    try {
      const payload = toFahrgastUpsertRequest(createForm, { isAdmin })

      if (isAdmin) {
        if (!payload.initiativeId || payload.initiativeId <= 0) {
          setCreateError('Bitte eine Initiative auswählen.')
          return
        }
      }

      const savedGuest = await createFahrgast(payload)

      setGuests((prev) => (savedGuest.aktiv ? [...prev, savedGuest] : prev))
      setSelectedGuestId(savedGuest.aktiv ? savedGuest.id : null)
      setIsCreateModalOpen(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Fahrgast konnte nicht angelegt werden.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <PassengerHeader
        canManageInitiatives={canManageInitiatives}
        isFahrer={isFahrer}
        isSideMenuOpen={isSideMenuOpen}
        onCloseSideMenu={closeSideMenu}
        onGoToPage={goToPage}
        onOpenProfile={() => navigate('/profil')}
        onOpenSideMenu={() => setIsSideMenuOpen(true)}
      />

      <div className="p-3 sm:p-4 lg:p-6">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
          <div className="border-b border-slate-200 p-4 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">Fahrgastinfos</h1>

            <PassengerSearchBar searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
          </div>

          {deleteError ? (
            <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800 sm:px-6">
              {deleteError}
            </div>
          ) : null}

          <PassengerTable
            filteredGuests={filteredGuests}
            isLoading={isLoading}
            loadError={loadError}
            selectedGuestId={selectedGuestId}
            onSelectedGuestIdChange={setSelectedGuestId}
          />

          {!isCrudRestricted ? (
            <div className="flex w-full flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:py-2.5"
              >
                Fahrgast hinzufügen
              </button>
              <button
                type="button"
                onClick={handleOpenEditModal}
                disabled={!selectedGuestId}
                className={`rounded-xl px-5 py-3 text-sm font-semibold transition sm:py-2.5 ${
                  selectedGuestId
                    ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={handleDeleteGuest}
                disabled={!selectedGuestId}
                className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition sm:py-2.5 ${
                  selectedGuestId ? 'bg-rose-500 hover:bg-rose-600' : 'cursor-not-allowed bg-rose-200'
                }`}
              >
                Gast löschen
              </button>
            </div>
          ) : null}
        </section>
      </div>

      {isEditModalOpen ? (
        <PassengerFormDialog
          closeLabel="Bearbeiten schließen"
          error={editError}
          form={editForm}
          initiatives={initiatives}
          isAdmin={isAdmin}
          nonAdminInitiativeName={selectedGuest?.initiativeName ?? currentUser?.initiative?.name ?? '-'}
          submitClassName="rounded-xl bg-[#0053a0] px-5 py-3 text-sm font-semibold text-white hover:brightness-110 sm:py-2.5"
          submitLabel="Änderungen speichern"
          title="Fahrgast bearbeiten"
          onClose={handleCloseEditModal}
          onFieldChange={handleEditFormChange}
          onSubmit={() => {
            void handleSaveGuestChanges()
          }}
        />
      ) : null}

      {isCreateModalOpen ? (
        <PassengerFormDialog
          closeLabel="Hinzufügen schließen"
          error={createError}
          form={createForm}
          initiatives={initiatives}
          initiativesError={initiativesError}
          isAdmin={isAdmin}
          nonAdminInitiativeName={currentUser?.initiative?.name ?? '-'}
          submitClassName="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 sm:py-2.5"
          submitLabel="Gast anlegen"
          title="Fahrgast hinzufügen"
          onClose={handleCloseCreateModal}
          onFieldChange={handleCreateFormChange}
          onSubmit={() => {
            void handleCreateGuest()
          }}
        />
      ) : null}

      {selectedGuest ? <PassengerDetailsCard selectedGuest={selectedGuest} /> : null}
    </main>
  )
}

export default FahrgastinfosPage
