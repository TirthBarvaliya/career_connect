import { jsPDF } from "jspdf";
import fs from "fs";

const doc = new jsPDF();
doc.setFont("helvetica", "bold");
doc.text("Hello 𝗯𝗼𝗹𝗱 𝗶𝘁𝗮𝗹𝗶𝗰", 10, 10);
doc.save("test-unicode.pdf");
console.log("done");
