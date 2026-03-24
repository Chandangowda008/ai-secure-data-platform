export async function parseFileContent(buffer, originalname = "") {
  const extension = originalname.toLowerCase().split(".").pop();

  switch (extension) {
    case "pdf": {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return result.text || "";
    }

    case "docx":
    case "doc": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    }

    case "log":
    case "txt":
    default:
      return buffer.toString("utf-8");
  }
}
