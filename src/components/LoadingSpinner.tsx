export function LoadingSpinner() {
    return (
      <div className="flex justify-center items-center" role="progressbar" aria-label="Loading">
        <div className="animate-spin rounded-full h-6 w-6 border-b-4 border-primary"></div>
      </div>
    );
  }

  