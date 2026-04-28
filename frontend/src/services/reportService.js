import api from "./api";

export const generateReport = async (filters, sendEmail = false) => {
  const payload = {
    ...filters, 
    sendEmail,
  };

  try {
      if (sendEmail) {
        console.log("Requesting email report with payload:", payload);
        const response = await api.post("/reports/custom", payload);
        console.log("Email request response:", response.data);
        return response.data;
      } else {
        console.log("Requesting PDF download with payload:", payload);
        const response = await api.post("/reports/custom", payload, {
          responseType: "blob",
        });
        console.log("PDF request successful, creating blob...");

        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "relatorio_financeiro.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        console.log("PDF download initiated.");
        return { message: "Download iniciado." };
      }
  } catch (error) {
      console.error("Error in generateReport service:", error.response || error);
      throw error;
  }
};