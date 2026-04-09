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

    const call = (label, actionName) => async () => {
      const api = window.ADC_actions || {};
      const fn = api[actionName];

      if (typeof fn !== 'function') {
        setStatus(`${label} is not available yet. Please wait...`);
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

    const filter = (value) => {
      const api = window.ADC_actions || {};
      if (api.setTaskFilter) api.setTaskFilter(value);
      else setStatus('Filter service not ready.');
    };

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
          h(ActionButton, { icon: 'P', label: 'Plan Session', tone: 'primary', onClick: call('Plan Session', 'workflowPlan') }),
          h(ActionButton, { icon: 'R', label: 'Review Day', tone: 'primary', onClick: call('Review Day', 'workflowReview') }),
          h(ActionButton, { icon: 'F', label: 'Recover Focus', tone: 'primary', onClick: call('Recover Focus', 'workflowRecover') })
        )
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'Quick Actions'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-3' },
          h(ActionButton, { icon: 'P', label: 'Open Profile', onClick: call('Open Profile', 'openProfilePanel') }),
          h(ActionButton, { icon: 'N', label: 'Open Notes', onClick: call('Open Notes', 'openNotesPanel') }),
          h(ActionButton, { icon: 'C', label: 'Open Chat', onClick: call('Open Chat', 'openChatPanel') }),
          h(ActionButton, { icon: 'T', label: 'Add Task', onClick: call('Add Task', 'scrollToTaskComposer') }),
          h(ActionButton, { icon: 'X', label: 'Clear Done', onClick: call('Clear Done', 'clearCompletedTasks') }),
          h(ActionButton, { icon: 'F', label: 'Focus Mode', onClick: call('Focus Mode', 'toggleFocusMode') })
        )
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'Task Filters'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-4' },
          h(ActionButton, { icon: 'A', label: 'All', onClick: () => { filter('all'); setStatus('Showing all tasks.'); } }),
          h(ActionButton, { icon: 'T', label: 'Active', onClick: () => { filter('active'); setStatus('Showing active tasks.'); } }),
          h(ActionButton, { icon: 'D', label: 'Done', onClick: () => { filter('completed'); setStatus('Showing completed tasks.'); } }),
          h(ActionButton, { icon: 'O', label: 'Overdue', onClick: () => { filter('overdue'); setStatus('Showing overdue tasks.'); } })
        )
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'AI Shortcuts'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-3' },
          h(ActionButton, { icon: 'S', label: 'Study Plan', tone: 'primary', onClick: call('Study Plan', 'workflowStudy') }),
          h(ActionButton, { icon: 'J', label: 'Career Plan', tone: 'primary', onClick: call('Career Plan', 'workflowCareer') }),
          h(ActionButton, { icon: 'W', label: 'Weekly Plan', tone: 'primary', onClick: call('Weekly Plan', 'workflowWeekly') })
        )
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'Navigation'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-3' },
          h(ActionButton, { icon: 'L', label: 'Learn', onClick: call('Learn Page', 'goLearnPage') }),
          h(ActionButton, { icon: 'G', label: 'Gallery', onClick: call('Gallery Page', 'goGalleryPage') }),
          h(ActionButton, { icon: 'A', label: 'About', onClick: call('About Page', 'goAboutPage') })
        )
      ),

      h(
        'div',
        { className: 'rpc-group' },
        h('div', { className: 'rpc-group-title' }, 'Boosters'),
        h(
          'div',
          { className: 'rpc-grid rpc-grid-3' },
          h(ActionButton, { icon: 'B', label: 'Success Bomb', tone: 'success', onClick: () => {
            const api = window.ADC_actions || {};
            if (api.triggerParty) api.triggerParty('success');
            else setStatus('Booster service not ready.');
          } }),
          h(ActionButton, { icon: 'H', label: 'Hype Bomb', tone: 'warn', onClick: () => {
            const api = window.ADC_actions || {};
            if (api.triggerParty) api.triggerParty('fail');
            else setStatus('Booster service not ready.');
          } }),
          h(ActionButton, { icon: 'S', label: 'Speakers', onClick: call('Speakers', 'toggleSpeakers') }),
          h(ActionButton, { icon: 'E', label: 'Export Tasks', onClick: call('Export Tasks', 'exportTasksAsJson') })
        )
      ),

      h('div', { className: 'rpc-status', role: 'status', 'aria-live': 'polite' }, status)
    );
  }

  window.ReactDOM.createRoot(mountNode).render(h(ProfileCommandCenter));
})();
