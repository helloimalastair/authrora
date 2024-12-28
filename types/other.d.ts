interface Alert {
	type: "error" | "success";
	message: string;
}

type RenderAlert = (alert: Alert) => void;