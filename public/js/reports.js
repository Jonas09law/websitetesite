document.addEventListener('DOMContentLoaded', () => {
    const reportHeaders = document.querySelectorAll('.report-header');
    
    reportHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const reportItem = header.closest('.report-item');
            const content = reportItem.querySelector('.report-content');
            const expandButton = header.querySelector('.report-expand');
            
            content.classList.toggle('active');
            expandButton.classList.toggle('active');
        });
    });
}); 