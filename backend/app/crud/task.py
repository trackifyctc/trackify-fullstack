from uuid import UUID

from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


def create_task(db: Session, payload: TaskCreate, owner_id: UUID) -> Task:
    task = Task(**payload.model_dump(), owner_id=owner_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(db: Session, owner_id: UUID, skip: int = 0, limit: int = 100) -> list[Task]:
    return (
        db.query(Task)
        .filter(Task.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_task(db: Session, task_id: UUID, owner_id: UUID) -> Task | None:
    return (
        db.query(Task)
        .filter(Task.id == task_id, Task.owner_id == owner_id)
        .first()
    )


def update_task(db: Session, task: Task, payload: TaskUpdate) -> Task:
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()
