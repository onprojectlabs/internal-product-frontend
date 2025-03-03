import { pdfjs } from "react-pdf";

const pdfjsVersion = "3.4.120";
const pdfjsWorker = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
