'use client'
import { PanelRightClose, AudioLines, FileVideo, LayoutTemplate, Network, FileBarChart, Library, ListTodo, BarChartBig, TableProperties, Sparkles, NotebookPen } from 'lucide-react'

export function StudioPanel() {
  const tools = [
    { id: 'audio', label: 'Audio Overview', icon: AudioLines },
    { id: 'slide', label: 'Slide Deck', icon: LayoutTemplate },
    { id: 'video', label: 'Video Overview', icon: FileVideo },
    { id: 'mindmap', label: 'Mind Map', icon: Network },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'flashcards', label: 'Flashcards', icon: Library },
    { id: 'quiz', label: 'Quiz', icon: ListTodo },
    { id: 'infographic', label: 'Infographic', icon: BarChartBig },
    { id: 'datatable', label: 'Data Table', icon: TableProperties },
  ]

  return (
    <div className="panel-container" style={{ width: 340, height: '100%', padding: '20px 0', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          Studio
        </h2>
        <button className="btn-ghost" style={{ padding: 6, border: 'none' }}>
          <PanelRightClose size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        
        {/* Banner 1 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30,58,95,0.4), rgba(46,125,50,0.4))',
          borderRadius: 12, padding: '16px', marginBottom: 12,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            Create an Audio Overview in: हिन्दी, বাংলা, ગુજરાતી, ಕನ್ನಡ, മലയാളം, मराठी, ਪੰਜਾਬੀ, தமிழ், తెలుగు
          </p>
        </div>

        {/* Banner 2 */}
        <div style={{
          background: 'var(--bg-app)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <Sparkles size={20} color="#a8c7fa" />
          <p style={{ fontSize: 13, flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>
            Try new Short Video Overviews!
          </p>
          <button style={{
            background: 'var(--bg-hover)', color: 'var(--text-primary)',
            border: 'none', borderRadius: 24, padding: '6px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer'
          }}>
            Try it
          </button>
        </div>

        {/* Tools Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10
        }}>
          {tools.map(tool => (
            <button
              key={tool.id}
              style={{
                background: 'var(--bg-app)',
                border: '1px solid transparent',
                borderRadius: 12,
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 12,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-app)'}
              title="Coming Soon"
            >
              <tool.icon size={20} color={
                tool.id === 'audio' ? '#a8c7fa' : 
                tool.id === 'slide' ? '#ffdf99' : 
                tool.id === 'video' ? '#c4eed0' : 
                tool.id === 'reports' ? '#c4eed0' :
                tool.id === 'flashcards' ? '#f2b8b5' :
                'var(--text-muted)'
              } />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                {tool.label}
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* FAB - Add Note */}
      <div style={{
        position: 'absolute', bottom: 32, left: 0, right: 0,
        display: 'flex', justifyContent: 'center'
      }}>
        <button style={{
          background: 'var(--text-primary)',
          color: 'var(--bg-app)',
          border: 'none',
          borderRadius: 32,
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'transform 0.1s'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <NotebookPen size={18} /> Add note
        </button>
      </div>

    </div>
  )
}
