interface FormAlertProps {
  error?: string;
  success?: string;
}

export function FormAlert({ error, success }: FormAlertProps) {
  if (!error && !success) {
    return null;
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  return (
    <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
      {success}
    </p>
  );
}
