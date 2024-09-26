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
  const quillRef = useRef(null); // Reference to the Quill editor

  // Function to download PDF
  const handlePDFDownload = () => {
    const editorContent = quillRef.current.getEditor().root;

    // Create a temporary div to render the content for PDF generation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorContent.innerHTML;
    document.body.appendChild(tempDiv);

    // Use html2canvas to take a screenshot of the content
    html2canvas(tempDiv, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth - 20; // Padding for the image inside the PDF
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 10; // Starting point on the page
      let remainingHeight = imgHeight; // Remaining height of the image

      // Add the image to the PDF with pagination
      while (remainingHeight > 0) {
        // Calculate how much can fit on the current page
        const fitHeight = Math.min(remainingHeight, pageHeight - position - 10);
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, fitHeight);
        remainingHeight -= fitHeight;

        // If there's still remaining height, add a new page
        if (remainingHeight > 0) {
          pdf.addPage();
          position = 10; // Reset position for the new page
        }
      }

      // Cleanup the temporary div
      document.body.removeChild(tempDiv);

      // Save the PDF
      pdf.save('document.pdf');
    });
  };

  // Save the content and replace old content if editing an existing document
  const handleSave = () => {
    const editorContent = quillRef.current.getEditor().root.innerHTML;

    if (currentDocIndex !== null) {
      // If editing an existing document, replace its content
      const updatedDocuments = [...savedDocuments];
      updatedDocuments[currentDocIndex].content = editorContent;
      setSavedDocuments(updatedDocuments);
    } else {
      // Otherwise, save as a new document
      const newDocument = {
        id: Date.now(),
        content: editorContent,
      };
      setSavedDocuments([...savedDocuments, newDocument]);
    }

    alert('Content saved successfully!');
  };

  // Toggle between Edit and View modes
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Load a saved document for editing
  const handleLoadDocument = (index) => {
    const document = savedDocuments[index];
    setContent(document.content); // Load document content
    setIsEditing(true); // Set to editing mode
    setCurrentDocIndex(index); // Set the index of the current document being edited
  };

  // Create a new document
  const handleCreateNew = () => {
    setContent(''); // Reset content
    setIsEditing(true); // Enable editing
    setCurrentDocIndex(null); // Reset current document index
  };

  // Quill editor modules and formats
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
        ]
      : false, // Disable toolbar when not editing
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <h1 className="text-3xl font-bold text-gray-800">Demo</h1>
        <div>
          {/* Button for PDF Download */}
          <button
            onClick={handlePDFDownload}
            className="bg-green-500 text-white px-4 py-2 mr-2 rounded-md hover:bg-green-600 transition"
          >
            Download as PDF
          </button>
          {/* Save Button */}
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
          >
            Save
          </button>
          {/* Create New Document Button */}
          <button
            onClick={handleCreateNew}
            className="bg-teal-500 text-white px-4 py-2 ml-2 rounded-md hover:bg-teal-600 transition"
          >
            Create New
          </button>
          {/* Edit Button to toggle editing */}
          <button
            onClick={handleEditToggle}
            className={`bg-yellow-500 text-white px-4 py-2 ml-2 rounded-md hover:bg-yellow-600 transition ${!isEditing ? '' : 'hidden'}`}
          >
            Finish Editing
          </button>
        </div>
      </header>

      {/* Main Editor Section */}
      <main className="flex-grow flex">
        <div className="w-full max-w-6xl mx-auto p-4 flex-grow flex">
          <ReactQuill
            ref={quillRef}
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            readOnly={!isEditing} // Disable editing when in view mode
            placeholder="Start writing here..."
            theme="snow"
            className="flex-grow h-full" // Remove overflow-y-auto to avoid scrollbar
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 bg-gray-200 text-center text-sm">
        &copy; 2024 Google Docs Clone. All Rights Reserved.
      </footer>

      {/* Saved Documents Section */}
      {savedDocuments.length > 0 && (
        <div className="p-4">
          <h2 className="text-xl font-bold">Saved Documents</h2>
          <ul>
            {savedDocuments.map((document, index) => (
              <li key={document.id} className="flex justify-between items-center p-2 border-b">
                <span>Document {index + 1}</span>
                <button
                  onClick={() => handleLoadDocument(index)}
                  className="bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
