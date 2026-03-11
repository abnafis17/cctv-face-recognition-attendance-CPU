import RelaySettingsPanel from "@/components/settings/RelaySettingsPanel"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          Configure company-level runtime behavior and integration endpoints.
        </p>
      </div>

      <RelaySettingsPanel />
    </div>
  )
}
