import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@matchday/shared";
const Alert = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, role: "alert", className: cn("relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7", className), ...props })));
Alert.displayName = "Alert";
const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("text-sm [&_p]:leading-relaxed", className), ...props })));
AlertDescription.displayName = "AlertDescription";
export { Alert, AlertDescription };
//# sourceMappingURL=alert.js.map