"use client";

import ReusableModal from "@/components/reusable/ReusableModal";
import ConfirmationModal from "@/components/reusable/ConfirmationModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ErpSettingsTab from "./erp/ErpSettingsTab";
import { RelayTabSection } from "./relay/RelayTabSection";
import { RelayEditForm } from "./relay/RelayEditForm";
import { useRelaySettingsPanel } from "@/hooks/settings/relay/useRelaySettingsPanel";

function asTrimmed(value: unknown): string {
  return String(value ?? "").trim();
}

export default function SettingsPanelPage() {
  const {
    loading,
    saving,
    deleting,
    search,
    setSearch,
    rows,
    addRelayOnUrl,
    setAddRelayOnUrl,
    addRelaySilentUrl,
    setAddRelaySilentUrl,
    editOpen,
    editRelayOnUrl,
    setEditRelayOnUrl,
    editRelaySilentUrl,
    setEditRelaySilentUrl,
    showDeleteModal,
    setShowDeleteModal,
    setSelectedForDelete,
    fetchRelaySettings,
    clearAddForm,
    submitAdd,
    closeEditModal,
    submitEdit,
    handleDelete,
    filteredRows,
    relay_columns,
    relay_statCards,
  } = useRelaySettingsPanel();

  return (
    <>
      <Tabs defaultValue="relay">
        <TabsList>
          <TabsTrigger value="relay">Relay API URLs</TabsTrigger>
          <TabsTrigger value="erp">ERP Urls</TabsTrigger>
        </TabsList>

        <TabsContent value="relay" className="space-y-4">
          <RelayTabSection
            statCards={relay_statCards}
            addRelayOnUrl={addRelayOnUrl}
            setAddRelayOnUrl={setAddRelayOnUrl}
            addRelaySilentUrl={addRelaySilentUrl}
            setAddRelaySilentUrl={setAddRelaySilentUrl}
            loading={loading}
            saving={saving}
            rows={rows}
            submitAdd={submitAdd}
            clearAddForm={clearAddForm}
            asTrimmed={asTrimmed}
            search={search}
            setSearch={setSearch}
            fetchRelaySettings={fetchRelaySettings}
            filteredRows={filteredRows}
            columns={relay_columns}
          />
        </TabsContent>

        <TabsContent value="erp" className="space-y-4">
          <ErpSettingsTab />
        </TabsContent>
      </Tabs>

      <ReusableModal
        open={editOpen}
        onClose={closeEditModal}
        title="Edit Relay API URLs"
        maxWidth="2xl"
      >
        <RelayEditForm
          editRelayOnUrl={editRelayOnUrl}
          setEditRelayOnUrl={setEditRelayOnUrl}
          editRelaySilentUrl={editRelaySilentUrl}
          setEditRelaySilentUrl={setEditRelaySilentUrl}
          saving={saving}
          submitEdit={submitEdit}
          closeEditModal={closeEditModal}
        />
      </ReusableModal>

      <ConfirmationModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedForDelete(null);
        }}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete relay API URLs?"
        description="This will remove company relay URL settings. Recognition and attendance will continue, but no relay API call will be fired."
      />
    </>
  );
}
