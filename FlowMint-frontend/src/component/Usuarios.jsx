import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Table, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import './Usuarios.css'; // Custom styles for the component

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [error, setError] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        usuario_id: null,
        nombre: '',
        apellido: '',
        user: '',
        pass: '',
        correo: '',
        rol_id: null
    });
    const [isEditMode, setIsEditMode] = useState(false);
    
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.rol?.nombre === 'Administrador';

    const fetchUsuarios = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/usuarios');
            setUsuarios(response.data);
            setError('');
        } catch (err) {
            setError('Error al cargar los usuarios. ¿El servidor está funcionando?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRoles = useCallback(async () => {
        try {
            setLoadingRoles(true);
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (err) {
            setError('Error al cargar los roles.');
            console.error(err);
        } finally {
            setLoadingRoles(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchUsuarios();
            fetchRoles();
        }
    }, [isAdmin, fetchUsuarios, fetchRoles]);

    const handleCloseModal = () => {
        setShowModal(false);
        setModalData({
            usuario_id: null,
            nombre: '',
            apellido: '',
            user: '',
            pass: '',
            correo: '',
            rol_id: null
        });
        setIsEditMode(false);
    };

    const handleShowCreateModal = () => {
        if (roles.length === 0) {
            setError("No se han cargado los roles. Intente de nuevo en un momento.");
            return;
        }
        setIsEditMode(false);
        setModalData({
            usuario_id: null,
            nombre: '',
            apellido: '',
            user: '',
            pass: '',
            correo: '',
            rol_id: roles[0].rol_id // Default to the first available role
        });
        setShowModal(true);
    };

    const handleShowEditModal = (usuario) => {
        setIsEditMode(true);
        // Ensure rol_id is a number, falling back to a default if it's missing
        const rolId = usuario.rol?.rol_id || (roles.length > 0 ? roles[0].rol_id : null);
        setModalData({ ...usuario, pass: '', rol_id: rolId });
        setShowModal(true);
    };
    
    const handleShowConfirmDelete = (usuario) => {
        setUserToDelete(usuario);
        setShowConfirmDelete(true);
    };

    const handleCloseConfirmDelete = () => {
        setShowConfirmDelete(false);
        setUserToDelete(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setModalData(prev => ({
            ...prev,
            [name]: name === 'rol_id' ? parseInt(value, 10) : value
        }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        
        const userData = { ...modalData };
        
        // Ensure rol_id is a valid number
        if (!userData.rol_id || isNaN(parseInt(userData.rol_id))) {
            setError("Debe seleccionar un rol válido.");
            return;
        }
        userData.rol_id = parseInt(userData.rol_id, 10);

        // Do not send empty password on update
        if (isEditMode && !userData.pass) {
            delete userData.pass;
        }

        try {
            if (isEditMode) {
                await api.patch(`/usuarios/${userData.usuario_id}`, userData);
            } else {
                await api.post('/usuarios', userData);
            }
            fetchUsuarios();
            handleCloseModal();
        } catch (err) {
            const apiError = err.response?.data?.message;
            const errorMessage = Array.isArray(apiError) ? apiError.join(', ') : apiError;
            setError(`Error al guardar el usuario: ${errorMessage || err.message}`);
            console.error(err);
        }
    };
    
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/usuarios/${userToDelete.usuario_id}`);
            fetchUsuarios();
            handleCloseConfirmDelete();
        } catch (err) {
            setError(`Error al eliminar el usuario: ${err.response?.data?.message || err.message}`);
            console.error(err);
        }
    };


    if (!isAdmin) {
        return (
            <div className="container mt-5">
                <Alert variant="danger">Acceso denegado. No tienes permisos para ver esta sección.</Alert>
            </div>
        );
    }
    
    if (loading) {
        return <div className="text-center mt-5"><Spinner animation="border" variant="info" /></div>;
    }

    return (
        <div className="container-fluid user-management-container">
            <h1 className="text-neon-cyan">Gestión de Usuarios</h1>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            <div className="d-flex justify-content-end mb-3">
                <Button variant="outline-success" onClick={handleShowCreateModal} disabled={loadingRoles}>
                    {loadingRoles ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaPlus className="me-2" />}
                    Crear Usuario
                </Button>
            </div>

            <div className="table-responsive">
                <Table striped bordered hover variant="dark" className="neon-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Nombre Completo</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map((usuario) => (
                            <tr key={usuario.usuario_id}>
                                <td>{usuario.usuario_id}</td>
                                <td>{usuario.user}</td>
                                <td>{`${usuario.nombre} ${usuario.apellido}`}</td>
                                <td>{usuario.correo}</td>
                                <td>
                                    <span className={`badge bg-${usuario.rol?.nombre === 'Administrador' ? 'danger' : 'primary'}`}>
                                        {usuario.rol?.nombre || 'N/A'}
                                    </span>
                                </td>
                                <td>
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowEditModal(usuario)} disabled={loadingRoles}>
                                        <FaEdit />
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleShowConfirmDelete(usuario)}>
                                        <FaTrash />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* Create / Edit Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton className="neon-modal-header">
                    <Modal.Title className="text-neon-cyan">{isEditMode ? 'Editar Usuario' : 'Crear Usuario'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="neon-modal-body">
                    <Form onSubmit={handleSaveChanges}>
                        <Form.Group className="mb-3" controlId="formNombre">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control type="text" name="nombre" value={modalData.nombre} onChange={handleFormChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formApellido">
                            <Form.Label>Apellido</Form.Label>
                            <Form.Control type="text" name="apellido" value={modalData.apellido} onChange={handleFormChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formUser">
                            <Form.Label>Usuario</Form.Label>
                            <Form.Control type="text" name="user" value={modalData.user} onChange={handleFormChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formCorreo">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" name="correo" value={modalData.correo} onChange={handleFormChange} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formPass">
                            <Form.Label>Contraseña {isEditMode && '(Dejar en blanco para no cambiar)'}</Form.Label>
                            <Form.Control type="password" name="pass" value={modalData.pass} onChange={handleFormChange} required={!isEditMode} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formRol">
                            <Form.Label>Rol</Form.Label>
                            <Form.Select name="rol_id" value={modalData.rol_id || ''} onChange={handleFormChange} required>
                                <option value="" disabled>Seleccione un rol...</option>
                                {roles.map(rol => (
                                    <option key={rol.rol_id} value={rol.rol_id}>{rol.nombre}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <div className="d-grid">
                            <Button variant="outline-primary" type="submit">
                                {isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal show={showConfirmDelete} onHide={handleCloseConfirmDelete} centered>
                <Modal.Header closeButton className="neon-modal-header">
                    <Modal.Title className="text-neon-cyan">Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body className="neon-modal-body">
                    ¿Estás seguro de que quieres eliminar al usuario <strong>{userToDelete?.user}</strong>? Esta acción no se puede deshacer.
                </Modal.Body>
                <Modal.Footer className="neon-modal-footer">
                    <Button variant="secondary" onClick={handleCloseConfirmDelete}>Cancelar</Button>
                    <Button variant="danger" onClick={handleDeleteUser}>Eliminar</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Usuarios;