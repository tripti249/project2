(function initializeReactDrawing() {
  const mountNode = document.getElementById('react-drawing-root');
  if (!mountNode || !window.React || !window.ReactDOM) return;

  const { useState, useEffect, useRef } = window.React;
  const h = window.React.createElement;

  function DrawingContainer() {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#6366f1'); // Default: Indigo
    const [brushSize, setBrushSize] = useState(5);
    const [tool, setTool] = useState('brush'); // brush, eraser, highlighter
    const [history, setHistory] = useState([]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      // Set canvas size based on parent container
      const resizeCanvas = () => {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth - 40; // padding
        canvas.height = 400;
        // Restore background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const startDrawing = (e) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (tool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 1.0;
      } else if (tool === 'highlighter') {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.3;
      } else {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1.0;
      }
      
      ctx.lineWidth = brushSize;
      setIsDrawing(true);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      // Save state to history for simple undo
      const canvas = canvasRef.current;
      setHistory(prev => [...prev.slice(-19), canvas.toDataURL()]);
    };

    const clearCanvas = () => {
      if (!confirm('Clear the entire canvas?')) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
    };

    const downloadImage = () => {
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      link.download = `AapkaDINACHARYA-Drawing-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    const colors = [
      '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#000000'
    ];

    return h(
      'section',
      { className: 'resources-section drawing-section', style: { marginTop: '20px' } },
      h(
        'div',
        { className: 'resources-inner' },
        h(
          'div',
          { className: 'resources-content' },
          h('h2', { className: 'resources-heading' }, 'Virtual Painting Area'),
          h(
            'p',
            { className: 'resources-sub' },
            'Express your creativity! Use multiple pens, colors, and brushes to sketch your ideas.'
          ),
          
          h(
            'div',
            { className: 'drawing-app-container', style: { 
              background: '#fff', 
              borderRadius: '16px', 
              padding: '20px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.08)'
            } },
            
            // Toolbar
            h(
              'div',
              { className: 'drawing-toolbar', style: { 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '15px', 
                marginBottom: '15px',
                alignItems: 'center',
                justifyContent: 'space-between'
              } },
              
              // Colors
              h(
                'div',
                { className: 'color-palette', style: { display: 'flex', gap: '8px' } },
                colors.map(c => h('button', {
                  key: c,
                  onClick: () => { setColor(c); setTool(tool === 'eraser' ? 'brush' : tool); },
                  style: {
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c && tool !== 'eraser' ? '3px solid #ddd' : 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s'
                  },
                  onMouseEnter: (e) => e.target.style.transform = 'scale(1.1)',
                  onMouseLeave: (e) => e.target.style.transform = 'scale(1)'
                }))
              ),

              // Tools & Sizes
              h(
                'div',
                { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
                h('select', {
                  value: tool,
                  onChange: (e) => setTool(e.target.value),
                  style: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }
                },
                  h('option', { value: 'brush' }, '🖋️ Pen'),
                  h('option', { value: 'highlighter' }, '🖍️ Highlighter'),
                  h('option', { value: 'eraser' }, '🧽 Eraser')
                ),
                h('input', {
                  type: 'range',
                  min: '1',
                  max: '50',
                  value: brushSize,
                  onChange: (e) => setBrushSize(parseInt(e.target.value)),
                  style: { width: '100px', cursor: 'pointer' }
                }),
                h('span', { style: { fontSize: '12px', color: '#666', width: '25px' } }, brushSize)
              ),

              // Actions
              h(
                'div',
                { style: { display: 'flex', gap: '10px' } },
                h('button', {
                  onClick: clearCanvas,
                  title: 'Clear Canvas',
                  style: { padding: '8px 12px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold' }
                }, '🗑️ Clear'),
                h('button', {
                  onClick: downloadImage,
                  title: 'Download Painting',
                  style: { padding: '8px 12px', borderRadius: '8px', background: '#dcfce7', color: '#10b981', border: 'none', cursor: 'pointer', fontWeight: 'bold' }
                }, '💾 Save')
              )
            ),

            // Canvas Area
            h('canvas', {
              ref: canvasRef,
              onMouseDown: startDrawing,
              onMouseMove: draw,
              onMouseUp: stopDrawing,
              onMouseOut: stopDrawing,
              onTouchStart: startDrawing,
              onTouchMove: draw,
              onTouchEnd: stopDrawing,
              style: {
                display: 'block',
                background: '#ffffff',
                cursor: 'crosshair',
                borderRadius: '12px',
                border: '1px solid #eee',
                touchAction: 'none' // Prevent scrolling while drawing on mobile
              }
            })
          )
        )
      )
    );
  }

  window.ReactDOM.createRoot(mountNode).render(h(DrawingContainer));
})();
