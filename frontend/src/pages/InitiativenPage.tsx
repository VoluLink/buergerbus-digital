import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InitiativeDeleteDialog } from '../features/initiatives/components/InitiativeDeleteDialog'
import { InitiativeFormDialog } from '../features/initiatives/components/InitiativeFormDialog'
import { InitiativeHeader } from '../features/initiatives/components/InitiativeHeader'
import { InitiativeMembersSection } from '../features/initiatives/components/InitiativeMembersSection'
import type { InitiativeFormState } from '../features/initiatives/types'
import { createEmptyForm, isDefaultInitiative } from '../features/initiatives/utils'
import { useRoleVisibility } from '../hooks/useRoleVisibility'
import {
  createInitiative,
  deleteInitiative,
  getInitiativeDeletePreview,
  getInitiativen,
  updateInitiative,
} from '../services/initiativeApi'
import type { Initiative, InitiativeDeletePreview } from '../types/Initiative'

function InitiativenPage() {
  const navigate = useNavigate()
  const { canManageInitiatives } = useRoleVisibility()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)

  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState<InitiativeFormState>(createEmptyForm())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)
  const [editForm, setEditForm] = useState<InitiativeFormState>(createEmptyForm())
  const [isUpdating, setIsUpdating] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [initiativeToDelete, setInitiativeToDelete] = useState<Initiative | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [deletePreview, setDeletePreview] = useState<InitiativeDeletePreview | null>(null)
  const [isDeletePreviewLoading, setIsDeletePreviewLoading] = useState(false)
  const [deletePreviewError, setDeletePreviewError] = useState<string | null>(null)

  const loadInitiatives = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const data = await getInitiativen()
      setInitiatives(data)
    } catch (err) {
      setInitiatives([])
      setLoadError(err instanceof Error ? err.message : 'Initiativen konnten nicht geladen werden.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    void (async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const data = await getInitiativen()
        if (!isMounted) return
        setInitiatives(data)
      } catch (err) {
        if (!isMounted) return
        setInitiatives([])
        setLoadError(err instanceof Error ? err.message : 'Initiativen konnten nicht geladen werden.')
      } finally {
        if (!isMounted) return
        setIsLoading(false)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  function closeSideMenu() {
    setIsSideMenuOpen(false)
  }

  function openCreateModal() {
    if (!canManageInitiatives) {
      return
    }

    setCreateForm(createEmptyForm())
    setSaveError(null)
    setSuccessMessage(null)
    setIsCreateModalOpen(true)
  }

  function closeCreateModal() {
    if (isSaving) {
      return
    }

    setIsCreateModalOpen(false)
  }

  function updateCreateField(field: keyof InitiativeFormState, value: string) {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function openEditModal(initiative: Initiative) {
    if (!canManageInitiatives) {
      return
    }

    setSelectedInitiative(initiative)
    setEditForm({
      name: initiative.name,
      beschreibung: initiative.beschreibung ?? '',
    })
    setEditError(null)
    setSuccessMessage(null)
    setIsEditModalOpen(true)
  }

  function closeEditModal() {
    if (isUpdating) {
      return
    }

    setIsEditModalOpen(false)
  }

  function updateEditField(field: keyof InitiativeFormState, value: string) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleUpdateInitiative() {
    if (!canManageInitiatives) {
      return
    }

    if (!selectedInitiative) {
      return
    }

    const trimmedName = editForm.name.trim()
    if (!trimmedName) {
      setEditError('Bitte gib einen Namen ein.')
      return
    }

    const nameAlreadyExists = initiatives.some(
      (initiative) =>
        initiative.id !== selectedInitiative.id &&
        initiative.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    )
    if (nameAlreadyExists) {
      setEditError('Eine Initiative mit diesem Namen existiert bereits.')
      return
    }

    setIsUpdating(true)
    setEditError(null)

    try {
      await updateInitiative(selectedInitiative.id, {
        name: trimmedName,
        beschreibung: editForm.beschreibung.trim(),
      })

      setIsEditModalOpen(false)
      await loadInitiatives()
      setSuccessMessage('Initiative wurde erfolgreich aktualisiert.')
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Initiative konnte nicht aktualisiert werden.')
    } finally {
      setIsUpdating(false)
    }
  }

  function openDeleteModal(initiative: Initiative) {
    if (!canManageInitiatives) {
      return
    }

    setInitiativeToDelete(initiative)
    setDeleteError(null)
    setSuccessMessage(null)
    setDeletePreview(null)
    setDeletePreviewError(null)
    setIsDeleteModalOpen(true)

    if (isDefaultInitiative(initiative)) {
      return
    }

    setIsDeletePreviewLoading(true)
    void (async () => {
      try {
        const preview = await getInitiativeDeletePreview(initiative.id)
        setDeletePreview(preview)
      } catch (err) {
        setDeletePreviewError(
          err instanceof Error ? err.message : 'Vorschau zum Löschen konnte nicht geladen werden.',
        )
      } finally {
        setIsDeletePreviewLoading(false)
      }
    })()
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return
    }

    setIsDeleteModalOpen(false)
  }

  async function handleDeleteInitiative() {
    if (!canManageInitiatives) {
      return
    }

    if (!initiativeToDelete) {
      return
    }

    if (isDefaultInitiative(initiativeToDelete)) {
      setDeleteError('Die Default-Initiative kann nicht gelöscht werden.')
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteInitiative(initiativeToDelete.id)
      setIsDeleteModalOpen(false)
      await loadInitiatives()
      setSuccessMessage('Initiative wurde gelöscht.')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Initiative konnte nicht gelöscht werden.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleCreateInitiative() {
    if (!canManageInitiatives) {
      return
    }

    const trimmedName = createForm.name.trim()

    if (!trimmedName) {
      setSaveError('Bitte einen Namen eingeben.')
      return
    }

    const nameAlreadyExists = initiatives.some(
      (initiative) => initiative.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    )
    if (nameAlreadyExists) {
      setSaveError('Eine Initiative mit diesem Namen existiert bereits.')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await createInitiative({
        name: trimmedName,
        beschreibung: createForm.beschreibung.trim(),
      })

      setIsCreateModalOpen(false)
      setCreateForm(createEmptyForm())
      await loadInitiatives()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Initiative konnte nicht erstellt werden.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <InitiativeHeader
        isSideMenuOpen={isSideMenuOpen}
        onOpenSideMenu={() => setIsSideMenuOpen(true)}
        onCloseSideMenu={closeSideMenu}
        onNavigateToProfile={() => navigate('/profil')}
      />

      <InitiativeMembersSection
        initiatives={initiatives}
        canManageInitiatives={canManageInitiatives}
        isLoading={isLoading}
        loadError={loadError}
        successMessage={successMessage}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
      />

      {isCreateModalOpen ? (
        <InitiativeFormDialog
          mode="create"
          form={createForm}
          error={saveError}
          isSaving={isSaving}
          onClose={closeCreateModal}
          onSubmit={() => void handleCreateInitiative()}
          onFieldChange={updateCreateField}
        />
      ) : null}

      {isEditModalOpen && selectedInitiative ? (
        <InitiativeFormDialog
          mode="edit"
          initiative={selectedInitiative}
          form={editForm}
          error={editError}
          isSaving={isUpdating}
          onClose={closeEditModal}
          onSubmit={() => void handleUpdateInitiative()}
          onFieldChange={updateEditField}
        />
      ) : null}

      {isDeleteModalOpen && initiativeToDelete ? (
        <InitiativeDeleteDialog
          initiative={initiativeToDelete}
          deleteError={deleteError}
          deletePreviewError={deletePreviewError}
          deletePreview={deletePreview}
          isDeleting={isDeleting}
          isDeletePreviewLoading={isDeletePreviewLoading}
          onClose={closeDeleteModal}
          onDelete={() => void handleDeleteInitiative()}
        />
      ) : null}
    </main>
  )
}

export default InitiativenPage
