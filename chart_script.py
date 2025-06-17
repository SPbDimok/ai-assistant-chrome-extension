import plotly.graph_objects as go
import pandas as pd
import numpy as np

# Data from the JSON
nodes_data = {
    "id": ["chrome-extension", "llm-server", "mcp-playwright", "mcp-tools", "web-pages"],
    "label": ["Chrome Ext", "LLM Server", "Playwright MCP", "Other MCP", "Web Pages"],
    "type": ["frontend", "backend", "mcp", "mcp", "target"],
    "x": [100, 400, 700, 700, 100],
    "y": [200, 200, 100, 300, 50]
}

connections_data = [
    {"from": "chrome-extension", "to": "llm-server", "type": "HTTP/WebSocket", "label": "User queries"},
    {"from": "llm-server", "to": "mcp-playwright", "type": "MCP Protocol", "label": "Auto commands"},
    {"from": "llm-server", "to": "mcp-tools", "type": "MCP Protocol", "label": "Tool exec"},
    {"from": "mcp-playwright", "to": "web-pages", "type": "Playwright API", "label": "Browser auto"},
    {"from": "chrome-extension", "to": "web-pages", "type": "Content Scripts", "label": "Page interact"}
]

# Create DataFrame for nodes
df_nodes = pd.DataFrame(nodes_data)

# Create figure
fig = go.Figure()

# Define colors for different node types
color_map = {
    'frontend': '#1FB8CD',
    'backend': '#FFC185', 
    'mcp': '#ECEBD5',
    'target': '#5D878F'
}

# Add connection lines first (so they appear behind nodes)
for conn in connections_data:
    from_node = df_nodes[df_nodes['id'] == conn['from']].iloc[0]
    to_node = df_nodes[df_nodes['id'] == conn['to']].iloc[0]
    
    fig.add_trace(go.Scatter(
        x=[from_node['x'], to_node['x']],
        y=[from_node['y'], to_node['y']],
        mode='lines',
        line=dict(color='#13343B', width=2),
        hovertemplate=f"{conn['type']}<br>{conn['label']}<extra></extra>",
        showlegend=False,
        name='',
        cliponaxis=False
    ))
    
    # Add arrow at the end of the line
    dx = to_node['x'] - from_node['x']
    dy = to_node['y'] - from_node['y']
    length = np.sqrt(dx**2 + dy**2)
    if length > 0:
        # Normalize and create arrow
        dx_norm = dx / length
        dy_norm = dy / length
        arrow_size = 15
        
        # Arrow position (slightly before the target node)
        arrow_x = to_node['x'] - dx_norm * 30
        arrow_y = to_node['y'] - dy_norm * 30
        
        # Arrow head points
        arrow_x1 = arrow_x - arrow_size * dx_norm + arrow_size * 0.3 * dy_norm
        arrow_y1 = arrow_y - arrow_size * dy_norm - arrow_size * 0.3 * dx_norm
        arrow_x2 = arrow_x - arrow_size * dx_norm - arrow_size * 0.3 * dy_norm  
        arrow_y2 = arrow_y - arrow_size * dy_norm + arrow_size * 0.3 * dx_norm
        
        fig.add_trace(go.Scatter(
            x=[arrow_x1, arrow_x, arrow_x2],
            y=[arrow_y1, arrow_y, arrow_y2],
            mode='lines',
            line=dict(color='#13343B', width=2),
            showlegend=False,
            hoverinfo='skip',
            cliponaxis=False
        ))

# Add nodes
for node_type in df_nodes['type'].unique():
    nodes_subset = df_nodes[df_nodes['type'] == node_type]
    
    fig.add_trace(go.Scatter(
        x=nodes_subset['x'],
        y=nodes_subset['y'],
        mode='markers+text',
        marker=dict(
            size=60,
            color=color_map[node_type],
            line=dict(width=2, color='#13343B')
        ),
        text=nodes_subset['label'],
        textposition='middle center',
        textfont=dict(size=10, color='#13343B'),
        hovertemplate='%{text}<extra></extra>',
        name=node_type.title(),
        showlegend=True,
        cliponaxis=False
    ))

# Update layout
fig.update_layout(
    title='Chrome Plugin Architecture',
    xaxis=dict(
        showgrid=False,
        showticklabels=False,
        zeroline=False,
        range=[0, 800]
    ),
    yaxis=dict(
        showgrid=False,
        showticklabels=False,
        zeroline=False,
        range=[0, 350]
    ),
    legend=dict(
        orientation='h',
        yanchor='bottom',
        y=1.05,
        xanchor='center',
        x=0.5
    ),
    plot_bgcolor='white'
)

# Save the chart
fig.write_image('chrome_plugin_architecture.png', width=800, height=600)