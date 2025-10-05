const axios = require('axios');

async function testPdfDownload() {
  console.log('Testing PDF download from BIS...');
  
  try {
    console.log('Making request to:', 'https://www.bis.org/fsi/fsisummaries/exsum_23905.pdf');
    
    const response = await axios({
      method: 'get',
      url: 'https://www.bis.org/fsi/fsisummaries/exsum_23905.pdf',
      responseType: 'arraybuffer',
      timeout: 30000,
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Download progress: ${percentCompleted}%`);
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('PDF size:', response.data.length, 'bytes');
    
    // Try to parse it
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(response.data);
    
    console.log('PDF Info:', pdfData.info);
    console.log('Number of pages:', pdfData.numpages);
    console.log('Text length:', pdfData.text.length);
    console.log('First 500 chars:', pdfData.text.substring(0, 500));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

testPdfDownload();