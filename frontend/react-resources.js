(function initializeReactResources() {
  const mountNode = document.getElementById('react-resources-root');
  if (!mountNode || !window.React || !window.ReactDOM) return;

  const { useState, useEffect } = window.React;
  const h = window.React.createElement;

  function ResourcesContainer() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsModalOpen(prev => {
        const newState = !prev;
        document.body.style.overflow = newState ? 'hidden' : '';
        return newState;
      });
    };

    // Close modal on Escape key
    useEffect(() => {
      const handleEsc = (e) => {
        if (e.key === 'Escape' && isModalOpen) toggleModal();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen]);

    return h(
      window.React.Fragment,
      null,
      h(
        'section',
        { className: 'resources-section' },
        h(
          'div',
          { className: 'resources-inner' },
          h(
            'div',
            { className: 'resources-content' },
            h('h2', { className: 'resources-heading' }, 'BTECH Academic Resources'),
            h(
              'p',
              { className: 'resources-sub' },
              'Get access to curated study materials, previous year questions (PYQs), and comprehensive notes for all semesters.'
            ),
            h(
              'div',
              { 
                className: 'resources-card', 
                onClick: toggleModal,
                role: 'button',
                'aria-label': 'Open BTECH Resources Modal',
                tabIndex: 0,
                onKeyDown: (e) => { if(e.key === 'Enter' || e.key === ' ') toggleModal(e); }
              },
              h('img', {
                src: '/assets/btech-notes.png',
                alt: 'BTECH Resources Banner',
                className: 'resources-img',
              }),
              h(
                'div',
                { className: 'resources-overlay' },
                h('span', { className: 'resources-btn' }, 'Access All Semesters')
              )
            )
          )
        )
      ),

      // Popup Modal - Rendered outside the section for better layering
      isModalOpen &&
        h(
          'div',
          { 
            className: 'modal-overlay', 
            style: { zIndex: 2000 }, // Corrected camelCase for React style
            onClick: toggleModal 
          },
          h(
            'div',
            {
              className: 'modal-card resources-modal',
              onClick: (e) => e.stopPropagation(),
            },
            h(
              'div',
              { className: 'modal-header' },
              h('h2', { className: 'modal-title' }, 'Directing to Drive'),
              h(
                'button',
                {
                  className: 'modal-close',
                  onClick: toggleModal,
                  'aria-label': 'Close modal',
                },
                h(
                  'svg',
                  {
                    viewBox: '0 0 24 24',
                    width: '20',
                    height: '20',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2.5',
                  },
                  h('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
                  h('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
                )
              )
            ),
            h(
              'div',
              { className: 'modal-body' },
              h(
                'p',
                { className: 'modal-message', style: { marginBottom: '15px' } },
                'You are directing to the drive where you get the notes and pyqs of BTECH All years.'
              ),
              h(
                'div',
                { className: 'drive-link-box' },
                h('span', { className: 'drive-label' }, 'Drive Link:'),
                h(
                  'a',
                  {
                    href: 'https://drive.google.com/drive/folders/1KVNtLAuAv7oMbJj8JPr8dpSCjhFrPNnq',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'drive-link-url',
                  },
                  'https://drive.google.com/drive/folders/1KVNtLAuAv7o...'
                )
              )
            ),
            h(
              'div',
              { className: 'modal-actions' },
              h(
                'button',
                { className: 'modal-cancel', onClick: toggleModal },
                'Cancel'
              ),
              h(
                'a',
                {
                  href: 'https://drive.google.com/drive/folders/1KVNtLAuAv7oMbJj8JPr8dpSCjhFrPNnq',
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: 'modal-save drive-go-btn',
                  style: { textDecoration: 'none', display: 'flex', alignItems: 'center' }
                },
                'Open Drive'
              )
            )
          )
        )
    );
  }

  window.ReactDOM.createRoot(mountNode).render(h(ResourcesContainer));
})();
