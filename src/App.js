import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const App = () => {
  const [content, setContent] = useState(''); // Content of the editor
  const [isEditing, setIsEditing] = useState(true); // Edit mode state
  const [savedDocuments, setSavedDocuments] = useState([]); // List of saved documents
  const [currentDocIndex, setCurrentDocIndex] = useState(null); // Index of the current document being edited
  const [currentPage, setCurrentPage] = useState(0); // Current pagination page
  const docsPerPage = 5; // Number of documents to show per page
  const quillRef = useRef(null); // Reference to the Quill editor

  // Function to download PDF
  const handlePDFDownload = () => {
  const editorContent = quillRef.current.getEditor().root;

  // Create a temporary div for rendering the content
  const tempDiv = document.createElement('div');
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.height = 'auto'; // Auto height for dynamic content
  tempDiv.innerHTML = editorContent.innerHTML;
  document.body.appendChild(tempDiv);

  const pdf = new jsPDF('p', 'mm', 'a4'); // A4 size
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const renderPDFPage = (content, position, resolve) => {
    html2canvas(content, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 20; // Padding for the image inside the PDF
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let remainingHeight = imgHeight; // Remaining height of the image
      let offsetY = 0; // Vertical offset for slicing the canvas

      while (remainingHeight > 0) {
        const fitHeight = Math.min(remainingHeight, pageHeight - position - 10); // Fit content to page height
        const canvasSlice = document.createElement('canvas');
        canvasSlice.width = canvas.width;
        canvasSlice.height = (fitHeight / imgHeight) * canvas.height;
        const context = canvasSlice.getContext('2d');
        context.drawImage(canvas, 0, -offsetY, canvas.width, canvas.height);

        const imgSlice = canvasSlice.toDataURL('image/png');
        pdf.addImage(imgSlice, 'PNG', 10, position, imgWidth, fitHeight);

        remainingHeight -= fitHeight;
        offsetY += fitHeight / imgHeight * canvas.height;

        // If there's remaining height, add a new page
        if (remainingHeight > 0) {
          pdf.addPage();
          position = 10; // Reset position for the new page
        }
      }
      resolve();
    });
  };

  renderPDFPage(tempDiv, 10, () => {
    document.body.removeChild(tempDiv);
    pdf.save('document.pdf');
  });
};




  const handleSave = () => {
    const editorContent = quillRef.current.getEditor().root.innerHTML;

    if (currentDocIndex !== null) {
      const updatedDocuments = [...savedDocuments];
      updatedDocuments[currentDocIndex].content = editorContent;
      setSavedDocuments(updatedDocuments);
    } else {
      const newDocument = {
        id: Date.now(),
        content: editorContent,
      };
      setSavedDocuments([...savedDocuments, newDocument]);
    }

    alert('Content saved successfully!');
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleLoadDocument = (index) => {
    const document = savedDocuments[index];
    setContent(document.content);
    setIsEditing(true);
    setCurrentDocIndex(index);
  };

  const handleCreateNew = () => {
    setContent('');
    setIsEditing(true);
    setCurrentDocIndex(null);
  };

  const insertTable = () => {
    const rows = parseInt(prompt('Enter the number of rows:'), 10);
    const cols = parseInt(prompt('Enter the number of columns:'), 10);
    
    if (rows > 0 && cols > 0) {
      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();

      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.margin = '10px 0';
      
      for (let i = 0; i < rows; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < cols; j++) {
          const td = document.createElement('td');
          td.style.border = '1px solid black';
          td.style.padding = '8px';
          td.innerText = `Row ${i + 1} Col ${j + 1}`;
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }

      if (selection) {
        quill.clipboard.dangerouslyPasteHTML(selection.index, table.outerHTML);
        quill.setSelection(selection.index + 1);
      }
    }
  };

  const modules = {
    toolbar: isEditing
      ? [
          [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ['link', 'image', 'video'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean'],
          ['table'],
        ]
      : false,
  };

  const formats = [
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'align',
    'list',
    'bullet',
    'link',
    'image',
    'video',
  ];

  // Calculate the documents to display based on the current page
  const indexOfLastDoc = (currentPage + 1) * docsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - docsPerPage;
  const currentDocs = savedDocuments.slice(indexOfFirstDoc, indexOfLastDoc);

  // Pagination buttons
  const handleNextPage = () => {
    if (indexOfLastDoc < savedDocuments.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <h1 className="text-3xl font-bold text-gray-800">DEMO</h1>
        <div>
          <button
            onClick={handlePDFDownload}
            className="bg-green-500 text-white px-4 py-2 mr-2 rounded-md hover:bg-green-600 transition"
          >
            Download as PDF
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
          >
            Save
          </button>
          <button
            onClick={handleCreateNew}
            className="bg-teal-500 text-white px-4 py-2 ml-2 rounded-md hover:bg-teal-600 transition"
          >
            Create New
          </button>
          <button
            onClick={handleEditToggle}
            className={`bg-yellow-500 text-white px-4 py-2 ml-2 rounded-md hover:bg-yellow-600 transition ${!isEditing ? '' : 'hidden'}`}
          >
            Finish Editing
          </button>
        </div>
      </header>

      <main className="flex flex-grow">
        <aside className="w-1/4 p-4 bg-gray-100 border-r">
          <h2 className="text-xl font-bold">Documents</h2>
          <ul>
            {currentDocs.map((document, index) => (
              <li key={document.id} className="flex justify-between items-center p-2 border-b">
                <span>Document {index + 1 + indexOfFirstDoc}</span>
                <button
                  onClick={() => handleLoadDocument(index + indexOfFirstDoc)}
                  className="bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
          <div className="flex justify-between mt-4">
            <button
              onClick={handlePrevPage}
              className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition"
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition"
              disabled={indexOfLastDoc >= savedDocuments.length}
            >
              Next
            </button>
          </div>
        </aside>

        <div className="flex-grow max-w-6xl mx-auto p-4">
          <ReactQuill
            ref={quillRef}
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            readOnly={!isEditing}
            placeholder="Start writing here..."
            theme="snow"
            className="flex-grow h-full"
            style={{ height: '100vh', width: '100%', maxWidth: '800px' }} // A4 dimensions
          />
        </div>
      </main>

      <footer className="p-4 bg-gray-200 text-center text-sm">
        &copy; 2024 Google Docs Clone. All Rights Reserved.
      </footer>
    </div>
  );
};

export default App;
