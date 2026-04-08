(function initializeReactProfileTools() {
  const mountNode = document.getElementById('react-profile-tools');
  if (!mountNode || !window.React || !window.ReactDOM) return;

  const { useState } = window.React;
  const h = window.React.createElement;

  function ActionButton(props) {
    const className = `rpc-btn ${props.tone || ''}`.trim();
    return h(
      'button',
      {
        type: 'button',
        className,
        onClick: props.onClick,
        title: props.title || props.label,
      },
      h('span', { className: 'rpc-btn-icon', 'aria-hidden': 'true' }, props.icon || '>'),
      h('span', { className: 'rpc-btn-label' }, props.label)
    );
  }

  function ProfileCommandCenter() {
    const [status, setStatus] = useState('Command center ready.');

    const call = (label, fn) => async () => {
      if (typeof fn !== 'function') {
        setStatus(`${label} is not available on this page yet.`);
        return;
      }

      try {
        const result = fn();
        if (result && typeof result.then === 'function') {
          await result;
        }
        setStatus(`${label} completed.`);
      } catch (err) {
        setStatus(`Action failed: ${err?.message || 'Unknown error'}`);
      }
    };

    const api = window.ADC_actions || {};
    const filter = (value) => api.setTaskFilter && api.setTaskFilter(value);

    return h(
      'section',
      { className: 'pp-section pp-section-react', 'aria-label': 'Profile command center' },
      h('h4', { className: 'pp-section-title rpc-title' }, 'Command Center'),
      h(
        'p',
        { className: 'rpc-subtitle' },
        'Linked workflow controls powered by React. Each action is wired to the live dashboard or the shared page shell.'
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'Workflow'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-3' },
          h(ActionButton, { icon: 'P', label: 'Plan Session', tone: 'primary', onClick: call('Plan Session', api.workflowPlan) }),
          h(ActionButton, { icon: 'R', label: 'Review Day', tone: 'primary', onClick: call('Review Day', api.workflowReview) }),
          h(ActionButton, { icon: 'F', label: 'Recover Focus', tone: 'primary', onClick: call('Recover Focus', api.workflowRecover) })
        )
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'Quick Actions'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-3' },
          h(ActionButton, { icon: 'P', label: 'Open Profile', onClick: call('Open Profile', api.openProfilePanel) }),
          h(ActionButton, { icon: 'N', label: 'Open Notes', onClick: call('Open Notes', api.openNotesPanel) }),
          h(ActionButton, { icon: 'C', label: 'Open Chat', onClick: call('Open Chat', api.openChatPanel) }),
          h(ActionButton, { icon: 'T', label: 'Add Task', onClick: call('Add Task', api.scrollToTaskComposer) }),
          h(ActionButton, { icon: 'X', label: 'Clear Done', onClick: call('Clear Done', api.clearCompletedTasks) }),
          h(ActionButton, { icon: 'F', label: 'Focus Mode', onClick: call('Focus Mode', api.toggleFocusMode) })
        )
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'Task Filters'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-4' },
          h(ActionButton, { icon: 'A', label: 'All', onClick: call('All Tasks', () => filter('all')) }),
          h(ActionButton, { icon: 'T', label: 'Active', onClick: call('Active Tasks', () => filter('active')) }),
          h(ActionButton, { icon: 'D', label: 'Done', onClick: call('Completed Tasks', () => filter('completed')) }),
          h(ActionButton, { icon: 'O', label: 'Overdue', onClick: call('Overdue Tasks', () => filter('overdue')) })
        )
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'AI Shortcuts'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-3' },
          h(ActionButton, { icon: 'S', label: 'Study Plan', tone: 'primary', onClick: call('Study Plan', api.workflowStudy) }),
          h(ActionButton, { icon: 'J', label: 'Career Plan', tone: 'primary', onClick: call('Career Plan', api.workflowCareer) }),
          h(ActionButton, { icon: 'W', label: 'Weekly Plan', tone: 'primary', onClick: call('Weekly Plan', api.workflowWeekly) })
        )
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'Navigation'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-3' },
          h(ActionButton, { icon: 'L', label: 'Learn', onClick: call('Learn Page', api.goLearnPage) }),
          h(ActionButton, { icon: 'G', label: 'Gallery', onClick: call('Gallery Page', api.goGalleryPage) }),
          h(ActionButton, { icon: 'A', label: 'About', onClick: call('About Page', api.goAboutPage) })
        )
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'Boosters'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-3' },
          h(ActionButton, { icon: 'B', label: 'Success Bomb', tone: 'success', onClick: call('Success Bomb', () => api.triggerParty && api.triggerParty('success')) }),
          h(ActionButton, { icon: 'H', label: 'Hype Bomb', tone: 'warn', onClick: call('Hype Bomb', () => api.triggerParty && api.triggerParty('fail')) }),
          h(ActionButton, { icon: 'S', label: 'Speakers', onClick: call('Speakers', api.toggleSpeakers) }),
          h(ActionButton, { icon: 'E', label: 'Export Tasks', onClick: call('Export Tasks', api.exportTasksAsJson) })
        )
      ),

      h('div', { className: 'rpc-status', role: 'status', 'aria-live': 'polite' }, status)
    );
  }

  window.ReactDOM.createRoot(mountNode).render(h(ProfileCommandCenter));
})();
