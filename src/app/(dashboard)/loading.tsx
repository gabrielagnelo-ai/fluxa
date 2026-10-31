export default function DashboardLoading() {
  return (
    <div className="fluxa-page" aria-busy="true" aria-label="Carregando">
      <div className="page-header">
        <div className="page-header-copy">
          <div className="skeleton h-10 w-56 max-w-full" />
          <div className="skeleton mt-3 h-5 w-40" />
        </div>
        <div className="skeleton h-11 w-80 max-w-full rounded-full" />
      </div>
      <div className="dashboard-grid">
        <div className="span-7"><div className="skeleton h-72" /></div>
        <div className="span-5"><div className="skeleton h-72" /></div>
        <div className="span-6"><div className="skeleton h-56" /></div>
        <div className="span-6"><div className="skeleton h-56" /></div>
      </div>
    </div>
  );
}
