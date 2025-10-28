import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function CommonGroups() {
  const [contact, setContact] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactRes, groupsRes] = await Promise.all([
          api.get(`/contacts/${userId}`),
          api.get('/groups')
        ]);

        setContact(contactRes.data.contact);
        const allGroups = groupsRes.data.groups || [];
        
        // Filter groups where both users are members
        const commonGroups = allGroups.filter(group => 
          group.members.some(member => 
            member.user?._id === userId || member.user === userId
          )
        );
        
        setGroups(commonGroups);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) return <div className="card">Loading...</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="fade-in">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>👥 Common Groups with {contact?.name}</h2>
            <p className="text-light">Groups you share with this contact</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              background: 'var(--accent-light)',
              color: 'var(--primary-medium)',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card text-center">
          <p>No common groups yet</p>
          <Link 
            to={`/groups/new?add=${userId}`}
            style={{
              display: 'inline-block',
              marginTop: '15px',
              padding: '10px 20px',
              background: 'var(--gradient-primary)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none'
            }}
          >
            Create Group Together
          </Link>
        </div>
      ) : (
        <div className="group-list">
          {groups.map(group => (
            <div key={group._id} className="card group-item">
              <h3>{group.name}</h3>
              <p>👥 {group.members?.length || 0} members</p>
              <Link 
                to={`/groups/${group._id}`}
                style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: 'var(--accent-light)',
                  color: 'var(--primary-medium)',
                  borderRadius: '8px',
                  textDecoration: 'none'
                }}
              >
                View Group →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}