import { useState, useRef, useEffect } from 'react'
// Icons unused, manual SVG used instead
// import { Plus, X, GripVertical } from 'lucide-react'
// import { cn } from '@/lib/utils'

interface Node {
  id: string
  x: number
  y: number
  label: string
}

interface Edge {
  id: string
  source: string
  target: string
}

interface MindmapData {
  nodes: Node[]
  edges: Edge[]
}

interface MindmapEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function MindmapEditor({ value, onChange, readOnly = false }: MindmapEditorProps) {
  const [data, setData] = useState<MindmapData>({ nodes: [], edges: [] })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [connectingNode, setConnectingNode] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  const svgRef = useRef<SVGSVGElement>(null)

  // Parse initial value
  useEffect(() => {
    try {
      if (value) {
        const parsed = JSON.parse(value)
        // Basic validation
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          setData(parsed)
        }
      }
    } catch (e) {
      // If parsing fails or empty, start fresh
      if (!value) {
        setData({ nodes: [], edges: [] })
      }
    }
  }, [value])

  const updateData = (newData: MindmapData) => {
    setData(newData)
    onChange(JSON.stringify(newData))
  }

  const handleSvgClick = (e: React.MouseEvent) => {
    if (readOnly) return
    // If clicking empty space and not dragging/connecting
    if (e.target === svgRef.current && !isDragging && !connectingNode) {
      setSelectedNode(null)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (readOnly) return
    if (e.target === svgRef.current) {
      const point = getSvgPoint(e.clientX, e.clientY)
      const newNode: Node = {
        id: `node_${Date.now()}`,
        x: point.x,
        y: point.y,
        label: 'New Node'
      }
      updateData({
        ...data,
        nodes: [...data.nodes, newNode]
      })
    }
  }

  const getSvgPoint = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const CTM = svgRef.current.getScreenCTM()
    if (!CTM) return { x: 0, y: 0 }
    return {
      x: (clientX - CTM.e) / CTM.a,
      y: (clientY - CTM.f) / CTM.d
    }
  }

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return
    e.stopPropagation()
    setSelectedNode(nodeId)
    setIsDragging(true)
    const point = getSvgPoint(e.clientX, e.clientY)
    setDragStart({ x: point.x, y: point.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (readOnly) return
    const point = getSvgPoint(e.clientX, e.clientY)
    setMousePos(point)

    if (isDragging && selectedNode) {
      const dx = point.x - dragStart.x
      const dy = point.y - dragStart.y
      
      const updatedNodes = data.nodes.map(node => {
        if (node.id === selectedNode) {
          return { ...node, x: node.x + dx, y: node.y + dy }
        }
        return node
      })

      setData({ ...data, nodes: updatedNodes }) // Optimistic update
      setDragStart(point)
    }
  }

  const handleMouseUp = () => {
    if (readOnly) return
    if (isDragging && selectedNode) {
      // Commit change
      updateData(data)
    }
    setIsDragging(false)
    setConnectingNode(null)
  }

  const startConnection = (e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return
    e.stopPropagation()
    setConnectingNode(nodeId)
  }

  const endConnection = (e: React.MouseEvent, targetId: string) => {
    if (readOnly) return
    e.stopPropagation()
    if (connectingNode && connectingNode !== targetId) {
      // Check if edge already exists
      const exists = data.edges.some(
        edge => 
          (edge.source === connectingNode && edge.target === targetId) ||
          (edge.source === targetId && edge.target === connectingNode)
      )

      if (!exists) {
        const newEdge: Edge = {
          id: `edge_${Date.now()}`,
          source: connectingNode,
          target: targetId
        }
        updateData({
          ...data,
          edges: [...data.edges, newEdge]
        })
      }
    }
    setConnectingNode(null)
  }

  const updateNodeLabel = (id: string, newLabel: string) => {
    const updatedNodes = data.nodes.map(node => 
      node.id === id ? { ...node, label: newLabel } : node
    )
    updateData({ ...data, nodes: updatedNodes })
  }

  const deleteNode = (id: string) => {
    const updatedNodes = data.nodes.filter(n => n.id !== id)
    const updatedEdges = data.edges.filter(e => e.source !== id && e.target !== id)
    updateData({ nodes: updatedNodes, edges: updatedEdges })
    setSelectedNode(null)
  }

  return (
    <div className="w-full h-full bg-slate-50 relative overflow-hidden rounded-md border border-slate-200">
      <div className="absolute top-4 right-4 z-10 bg-white/90 p-2 rounded shadow text-xs text-slate-500 pointer-events-none">
        Double-click to add node • Drag to move • Drag from dot to connect
      </div>
      
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleSvgClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="28"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Edges */}
        {data.edges.map(edge => {
          const source = data.nodes.find(n => n.id === edge.source)
          const target = data.nodes.find(n => n.id === edge.target)
          if (!source || !target) return null

          return (
            <line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#94a3b8"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          )
        })}

        {/* Connection Line (while dragging) */}
        {connectingNode && (
          <line
            x1={data.nodes.find(n => n.id === connectingNode)?.x}
            y1={data.nodes.find(n => n.id === connectingNode)?.y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}

        {/* Nodes */}
        {data.nodes.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x},${node.y})`}
            className="cursor-move"
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onMouseUp={(e) => endConnection(e, node.id)}
          >
            <rect
              x="-60"
              y="-25"
              width="120"
              height="50"
              rx="8"
              fill="white"
              stroke={selectedNode === node.id ? '#3b82f6' : '#cbd5e1'}
              strokeWidth={selectedNode === node.id ? '2' : '1'}
              className="transition-colors"
            />
            
            <foreignObject x="-55" y="-20" width="110" height="40">
              <input
                value={node.label}
                onChange={(e) => updateNodeLabel(node.id, e.target.value)}
                className="w-full h-full text-center text-sm bg-transparent outline-none resize-none flex items-center justify-center overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()} // Allow text selection
              />
            </foreignObject>

            {/* Connection Handle */}
            <circle
              r="6"
              cx="0"
              cy="25"
              fill="#cbd5e1"
              className="hover:fill-blue-500 cursor-pointer"
              onMouseDown={(e) => startConnection(e, node.id)}
            />

            {/* Delete Button (only if selected) */}
            {selectedNode === node.id && (
              <g
                transform="translate(60, -25)"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNode(node.id)
                }}
                className="cursor-pointer hover:opacity-80"
              >
                <circle r="8" fill="#ef4444" />
                <path
                  d="M-2.5 -2.5 L2.5 2.5 M2.5 -2.5 L-2.5 2.5"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
