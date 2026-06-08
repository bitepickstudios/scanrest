import { Alert } from "@heroui/react";

type Status = "default" | "accent" | "success" | "warning" | "danger";

export default function StaffAlert({
  status = "danger",
  title,
  description,
  className,
}: {
  status?: Status;
  title?: string;
  description: string;
  className?: string;
}) {
  return (
    <Alert status={status} className={className}>
      <Alert.Indicator />
      <Alert.Content>
        {title && <Alert.Title>{title}</Alert.Title>}
        <Alert.Description>{description}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
